import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$provider/$owner/$repo/pull/$prId')({
  component: PullRequestComponent,
})

function PullRequestComponent() {
  return <div>Hello "/$provider/$owner/$repo/pulls/$prId"!</div>
}
