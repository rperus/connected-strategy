/**
 * Server Lifecycle Manager
 * 
 * Centralized registry for startup and shutdown hooks.
 * Decouples process signal handling (SIGTERM, SIGINT) from the actual resources 
 * (like Express Server, SQLite connections, Schedulers) that need to be closed.
 */

type ShutdownHook = () => Promise<void> | void;

class LifecycleManager {
  private shutdownHooks: { name: string; hook: ShutdownHook }[] = [];
  private isShuttingDown = false;

  /**
   * Register a resource to be closed during graceful shutdown.
   */
  public registerShutdownHook(name: string, hook: ShutdownHook): void {
    this.shutdownHooks.push({ name, hook });
  }

  /**
   * Execute all shutdown hooks in reverse order of registration.
   */
  public async shutdown(exitCode: number = 0): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    
    console.log('\n[LifecycleManager] Initiating graceful shutdown...');
    
    // Execute in reverse order (LIFO) so that dependents shut down before dependencies
    const reversedHooks = [...this.shutdownHooks].reverse();
    
    for (const { name, hook } of reversedHooks) {
      try {
        console.log(`[LifecycleManager] Stopping: ${name}...`);
        await Promise.resolve(hook());
        console.log(`[LifecycleManager] Stopped: ${name} ✅`);
      } catch (err) {
        console.error(`[LifecycleManager] Error stopping ${name}:`, err);
      }
    }

    console.log('[LifecycleManager] Shutdown complete. Exiting process.');
    process.exit(exitCode);
  }

  /**
   * Bind standard OS signals to the shutdown process.
   */
  public trapSignals(): void {
    process.on('SIGTERM', () => {
      console.log('[LifecycleManager] Received SIGTERM');
      this.shutdown(0);
    });

    process.on('SIGINT', () => {
      console.log('[LifecycleManager] Received SIGINT');
      this.shutdown(0);
    });
    
    process.on('uncaughtException', (err) => {
      console.error('[LifecycleManager] Uncaught Exception:', err);
      this.shutdown(1);
    });

    process.on('unhandledRejection', (reason) => {
      console.error('[LifecycleManager] Unhandled Rejection:', reason);
      this.shutdown(1);
    });
  }
}

export const ServerLifecycleManager = new LifecycleManager();
