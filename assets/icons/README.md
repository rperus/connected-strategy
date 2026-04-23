# Connected Strategy — Icon Assets

## Files

| File | Size | Usage |
|------|------|-------|
| `icon.png` | 512×512 | Master source — Electron dev mode, Linux |
| `icon-256.png` | 256×256 | Windows taskbar (generated) |
| `icon-128.png` | 128×128 | Windows notifications (generated) |
| `icon-64.png` | 64×64 | General (generated) |
| `icon-32.png` | 32×32 | Windows title bar (generated) |
| `icon-16.png` | 16×16 | Windows favicon (generated) |
| `icon.ico` | multi | Windows installer, tray, shortcut |

## Generating Icons

```bash
# From repo root — requires npm install first
node scripts/generate-icons.js
```

Requires `sharp` and `png-to-ico` as devDependencies in apps/desktop.
