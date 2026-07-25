export function AtmosphericBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 bg-background"
      style={{
        backgroundImage: [
          "radial-gradient(ellipse 1100px 620px at 50% -12%, color-mix(in oklch, var(--secondary) 30%, transparent), transparent 60%)",
          "radial-gradient(ellipse 900px 700px at 88% 8%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 65%)",
          "radial-gradient(ellipse 800px 600px at 6% 20%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 60%)",
        ].join(", "),
      }}
    />
  );
}
