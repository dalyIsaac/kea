import { useNavigate } from "@tanstack/react-router";
import { Check, GitCompare, X } from "lucide-react";
import { FC, ReactElement, useState } from "react";
import * as apiTypes from "~/api/types";
import { Avatar } from "~/shadcn/ui/avatar";
import { Button } from "~/shadcn/ui/button";
import { Card } from "~/shadcn/ui/card";
import { Checkbox } from "~/shadcn/ui/checkbox";
import { trimSha } from "~/utils/git";
import { PullRequestDetailsParams } from "~/utils/validate-routes";

export const PullRequestCommits: FC<{
  className?: string;
  commits: apiTypes.Commit[] | undefined;
  params: PullRequestDetailsParams;
  headSha: string | undefined;
  baseSha: string | undefined;
  selectedBase: string | undefined;
  selectedCompare: string | undefined;
}> = ({ className, commits, params, headSha, baseSha, selectedBase, selectedCompare }) => {
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [selectedCommits, setSelectedCommits] = useState<string[]>([]);
  const navigate = useNavigate();

  const onCheckboxChange = (sha: string) =>
    setSelectedCommits((prevSelectedCommits) => {
      const newSelection = prevSelectedCommits.includes(sha)
        ? prevSelectedCommits.filter((selectedSha) => selectedSha !== sha)
        : [...prevSelectedCommits, sha];

      return newSelection;
    });

  const onCompareClick = () => {
    const [firstSha, secondSha] = selectedCommits;

    if (!firstSha || !secondSha || !commits) {
      return;
    }

    const firstShaIndex = commits.findIndex((commit) => commit.sha === firstSha);
    const secondShaIndex = commits.findIndex((commit) => commit.sha === secondSha);

    if (firstShaIndex === -1 || secondShaIndex === -1) {
      return;
    }

    const [from, to] =
      firstShaIndex < secondShaIndex ? [firstSha, secondSha] : [secondSha, firstSha];

    navigate({
      to: "/$provider/$owner/$repo/pull/$prId/review",
      params,
      search: { base: from, compare: to },
    });
  };

  let buttons: ReactElement;
  if (showCheckboxes) {
    const cancelButton = (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setShowCheckboxes(false);
          setSelectedCommits([]);
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    );

    if (selectedCommits.length === 2) {
      buttons = (
        <div className="flex gap-1">
          {cancelButton}
          <Button variant="ghost" size="icon" onClick={onCompareClick}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      );
    } else {
      buttons = cancelButton;
    }
  } else {
    buttons = (
      <Button variant="ghost" size="icon" onClick={() => setShowCheckboxes(true)}>
        <GitCompare className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Card className={`${className} p-0`}>
      <div className="flex justify-between items-center h-7 px-1 border-b">
        <h3 className="text-sm font-medium leading-none">Commits</h3>
        {commits && commits.length > 1 && <div className="flex items-center -mr-1">{buttons}</div>}
      </div>

      <ul className="divide-y divide-border text-sm">
        {commits?.map((commit) => (
          <li
            key={commit.sha}
            className={`flex px-1 py-0.5 hover:bg-muted ${
              commit.sha === selectedBase || commit.sha === selectedCompare ? "bg-accent/10" : ""
            }`}
          >
            <div className="flex items-center gap-0.5 flex-1 min-w-0">
              {showCheckboxes && (
                <Checkbox
                  className="h-3 w-3 mt-0.5"
                  checked={selectedCommits.includes(commit.sha)}
                  disabled={selectedCommits.length === 2 && !selectedCommits.includes(commit.sha)}
                  onCheckedChange={() => onCheckboxChange(commit.sha)}
                  aria-label={`Select commit ${commit.sha}`}
                />
              )}

              <div className="flex-1 min-w-0 leading-tight">
                <div className="flex items-center gap-0.5">
                  <a
                    href={`#commit-${commit.sha}`}
                    title={commit.message}
                    className="flex-1 truncate hover:underline"
                  >
                    {commit.message}
                  </a>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {commit.sha === headSha && (
                      <span className="text-xs text-muted-foreground">HEAD</span>
                    )}
                    {commit.sha === baseSha && (
                      <span className="text-xs text-muted-foreground">BASE</span>
                    )}
                    {commit.author && (
                      <Avatar className="h-3 w-3">
                        <img src={commit.author.avatar_url} alt={commit.author.login} />
                      </Avatar>
                    )}
                  </div>
                </div>

                <a
                  href={`#commit-${commit.sha}`}
                  title={commit.sha}
                  className="font-mono text-xs text-muted-foreground hover:underline"
                >
                  {trimSha(commit.sha)}
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};
