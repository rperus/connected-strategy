import json
from collections import defaultdict
from pathlib import Path

graph_path = Path('graphify-out/graph.json')
data = json.loads(graph_path.read_text(encoding="utf-8"))

nodes = data["nodes"]
links = data["links"]
node_by_id = {n["id"]: n for n in nodes}

incoming_ext = defaultdict(list)
outgoing_ext = defaultdict(list)

for link in links:
    src_id = link["source"]
    tgt_id = link["target"]
    rel = link["relation"]
    
    src_node = node_by_id.get(src_id)
    tgt_node = node_by_id.get(tgt_id)
    
    if not src_node or not tgt_node:
        continue
        
    src_file = src_node.get("source_file")
    tgt_file = tgt_node.get("source_file")
    
    if src_file != tgt_file:
        incoming_ext[tgt_id].append((src_id, rel, src_file))
        outgoing_ext[src_id].append((tgt_id, rel, tgt_file))

# Filters
ignored_patterns = [
    "main.js", "main.tsx", "preload.js", "App.tsx", ".gitkeep.ts",
    "package.json", "tsconfig", "vite.config", "test", "benchmark",
    "generate-pairs", "export-jsonl", "extract-prompts", "scripts/", "config/",
    "node_modules"
]

def is_ignored(file_path):
    if not file_path:
        return True
    if not (file_path.startswith("packages/") or file_path.startswith("apps/")):
        return True
    return any(p in file_path for p in ignored_patterns)

# Calculate incoming count per file
file_nodes = defaultdict(list)
file_incoming_count = defaultdict(int)

for node in nodes:
    fid = node["id"]
    file_path = node.get("source_file")
    if not file_path:
        continue
    file_nodes[file_path].append(node)
    
    ext_in = incoming_ext.get(fid, [])
    if ext_in:
        file_incoming_count[file_path] += len(ext_in)

# Orphan Files
refined_orphan_files = []
for file_path, f_nodes in file_nodes.items():
    if is_ignored(file_path):
        continue
    in_count = file_incoming_count[file_path]
    if in_count == 0:
        refined_orphan_files.append({
            "file": file_path,
            "nodes_count": len(f_nodes)
        })

# Orphan Code Nodes
refined_orphan_nodes = []
for node in nodes:
    fid = node["id"]
    label = node["label"]
    file_path = node.get("source_file")
    
    if not file_path or node.get("file_type") != "code" or label.endswith((".ts", ".tsx", ".js")):
        continue
    if is_ignored(file_path):
        continue
    if file_incoming_count[file_path] == 0:
        continue
        
    ext_in = incoming_ext.get(fid, [])
    if len(ext_in) == 0:
        refined_orphan_nodes.append({
            "label": label,
            "file": file_path,
            "id": fid
        })

# Logical Duplicates (Jaccard similarity > 0.85)
community_nodes = defaultdict(list)
for node in nodes:
    comm = node.get("community")
    if comm is not None:
        community_nodes[comm].append(node)

duplicates = []
for comm, c_nodes in community_nodes.items():
    code_nodes = [n for n in c_nodes if n.get("file_type") == "code" and not n["label"].endswith((".ts", ".tsx", ".js"))]
    if len(code_nodes) < 2:
        continue
        
    neighbor_sets = {}
    for n in code_nodes:
        nid = n["id"]
        neighbors = set()
        for link in links:
            if link["source"] == nid:
                neighbors.add(link["target"])
            elif link["target"] == nid:
                neighbors.add(link["source"])
        neighbor_sets[nid] = neighbors

    for i in range(len(code_nodes)):
        n1 = code_nodes[i]
        nid1 = n1["id"]
        set1 = neighbor_sets[nid1]
        if len(set1) < 2:
            continue
            
        for j in range(i + 1, len(code_nodes)):
            n2 = code_nodes[j]
            nid2 = n2["id"]
            set2 = neighbor_sets[nid2]
            if len(set2) < 2:
                continue
                
            intersection = len(set1.intersection(set2))
            union = len(set1.union(set2))
            jaccard = intersection / union if union > 0 else 0
            
            if jaccard > 0.85:
                duplicates.append({
                    "label1": n1["label"],
                    "file1": n1["source_file"],
                    "label2": n2["label"],
                    "file2": n2["source_file"],
                    "jaccard": jaccard,
                    "community": comm
                })

# Write findings JSON
findings = {
    "orphan_files": refined_orphan_files,
    "orphan_nodes": refined_orphan_nodes,
    "duplicates": duplicates
}

Path('scratch/fase2_findings.json').write_text(json.dumps(findings, indent=2, ensure_ascii=False), encoding="utf-8")

# Write Markdown report
md_lines = [
    "# Reporte de Deuda Técnica Quirúrgica (Fase 2)",
    "",
    f"## 1. Archivos Huérfanos Refinados ({len(refined_orphan_files)} encontrados)",
    "Estos son archivos en `apps/` o `packages/` que no tienen relaciones externas entrantes (nadie los importa, llama o referencia).",
    "",
    "| Archivo | Cantidad de Nodos Internos |",
    "| --- | --- |"
]
for item in sorted(refined_orphan_files, key=lambda x: x["file"]):
    md_lines.append(f"| `{item['file']}` | {item['nodes_count']} |")

md_lines.append("")
md_lines.append(f"## 2. Nodos de Código Huérfanos ({len(refined_orphan_nodes)} encontrados)")
md_lines.append("Estos son elementos exportados (funciones, clases, variables) dentro de archivos activos, pero que nunca son llamados ni referenciados desde el exterior del archivo.")
md_lines.append("")
md_lines.append("| Elemento | Archivo | ID en el Grafo |")
md_lines.append("| --- | --- | --- |")
for item in sorted(refined_orphan_nodes, key=lambda x: (x["file"], x["label"]))[:40]:
    md_lines.append(f"| `{item['label']}` | `{item['file']}` | `{item['id']}` |")

if len(refined_orphan_nodes) > 40:
    md_lines.append(f"| ... y {len(refined_orphan_nodes) - 40} más | | |")

md_lines.append("")
md_lines.append(f"## 3. Duplicados Lógicos / Clones en la Misma Comunidad ({len(duplicates)} encontrados)")
md_lines.append("Nodos dentro de la misma comunidad con firmas de conexión casi idénticas (Jaccard > 0.85). Indica lógica duplicada o fuertemente redundante.")
md_lines.append("")
md_lines.append("| Nodo 1 | Archivo 1 | Nodo 2 | Archivo 2 | Similitud Jaccard | Comunidad |")
md_lines.append("| --- | --- | --- | --- | --- | --- |")
for item in sorted(duplicates, key=lambda x: -x["jaccard"])[:40]:
    md_lines.append(f"| `{item['label1']}` | `{item['file1']}` | `{item['label2']}` | `{item['file2']}` | {item['jaccard']:.2f} | {item['community']} |")

if len(duplicates) > 40:
    md_lines.append(f"| ... y {len(duplicates) - 40} más | | | | | |")

Path('scratch/fase2_findings.md').write_text('\n'.join(md_lines), encoding="utf-8")
print(f"Findings written to scratch/fase2_findings.json and scratch/fase2_findings.md")
print(f"Orphan files: {len(refined_orphan_files)}, Orphan nodes: {len(refined_orphan_nodes)}, Duplicates: {len(duplicates)}")
