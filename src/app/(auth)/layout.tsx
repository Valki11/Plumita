export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="marco">
      <main className="marco-auth">{children}</main>
    </div>
  );
}
