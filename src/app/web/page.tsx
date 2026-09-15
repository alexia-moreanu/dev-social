import { getCurrentUser } from "@/lib/current-user";
import { buildNetworkGraph } from "@/lib/graph";
import NetworkGraph from "@/components/NetworkGraph";

export default async function WebPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { nodes, edges } = await buildNetworkGraph(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-5">
      <div className="mb-4 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold">Your web</h1>
          <p className="text-xs text-muted">
            The people you&apos;re connected to, and the people you should be. Drag nodes around, click one to visit their profile.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" /> you
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-up" /> connected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-6 border-t border-dashed border-muted" /> similar
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-2">
        <NetworkGraph nodes={nodes} edges={edges} centerId={user.id} />
      </div>
    </div>
  );
}
