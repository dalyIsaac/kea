import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$provider/")({
  component: ProviderComponent,
});

const ALLOWED_PROVIDERS = ["gh"];

function ProviderComponent() {
  const { provider } = Route.useParams();

  return (
    <div className="p-2">
      {ALLOWED_PROVIDERS.includes(provider) ? (
        <h3>Welcome {provider} Provider!</h3>
      ) : (
        <h3>Invalid Provider</h3>
      )}
    </div>
  );
}
