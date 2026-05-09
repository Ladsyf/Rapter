export default function TerminalOutputView({ output }: { output: string }) {
  return (
    <>
      {output.length > 0 && (
        <pre className="max-h-56 overflow-auto rounded-xl border border-white/15 bg-[#05080f] px-3 py-2 text-xs text-[#8bf7c3] whitespace-pre-wrap">
          {output || "Waiting for output..."}
        </pre>
      )}
    </>
  );
}