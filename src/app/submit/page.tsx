import SubmitForm from "@/components/SubmitForm";

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-lg font-semibold mb-1">Post something</h1>
      <p className="text-sm text-muted mb-6">
        A project, a snippet, a tip, a clip, a link, or just an update — pick what fits.
      </p>
      <SubmitForm />
    </div>
  );
}
