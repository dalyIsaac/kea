import { useNavigate } from "@tanstack/react-router";
import { Check, GitCompare, X } from "lucide-react";
import { FC, ReactElement, useState } from "react";
import * as apiTypes from "~/api/types";
import { cn } from "~/lib/utils";
import { Avatar } from "~/shadcn/ui/avatar";
import { Button } from "~/shadcn/ui/button";
import { Card } from "~/shadcn/ui/card";
import { Checkbox } from "~/shadcn/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/shadcn/ui/tooltip";
import { trimSha } from "~/utils/git";
import { PullRequestDetailsParams } from "~/utils/validate-routes";

const ButtonWithTooltip: FC<{
  tooltip: string;
  icon: ReactElement;
  onClick: () => void;
}> = ({ tooltip, icon, onClick }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" className="h-5 w-5 p-0" onClick={onClick}>
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const PullRequestCommits: FC<{
  className?: string;
  commits: apiTypes.Commit[] | undefined;
  params: PullRequestDetailsParams;
  headSha: string | undefined;
  baseSha: string | undefined;
  selectedBase: string | undefined;
  selectedHead: string | undefined;
}> = ({ className, commits, params, headSha, baseSha, selectedBase, selectedHead }) => {
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
      search: { base: from, head: to },
    });
  };

  let buttons: ReactElement;
  if (showCheckboxes) {
    const cancelButton = (
      <ButtonWithTooltip
        tooltip="Cancel selection"
        icon={<X className="h-3 w-3" />}
        onClick={() => {
          setShowCheckboxes(false);
          setSelectedCommits([]);
        }}
      />
    );

    if (selectedCommits.length === 2) {
      buttons = (
        <div className="flex gap-0.5">
          {cancelButton}
          <ButtonWithTooltip
            tooltip="Compare selected commits"
            icon={<Check className="h-3 w-3" />}
            onClick={onCompareClick}
          />
        </div>
      );
    } else {
      buttons = cancelButton;
    }
  } else {
    buttons = (
      <ButtonWithTooltip
        tooltip="Compare commits"
        icon={<GitCompare className="h-3 w-3" />}
        onClick={() => setShowCheckboxes(true)}
      />
    );
  }

  return (
    <Card className={cn(className, "p-0 rounded-none")}>
      <div className="flex justify-between items-center h-7 px-1 border-b">
        <h3 className="text-sm font-medium leading-none">Commits</h3>
        {commits && commits.length > 1 && <div className="flex items-center -mr-1">{buttons}</div>}
      </div>

      <ul className="divide-y divide-border text-sm">
        {commits?.map((commit) => (
          <li
            key={commit.sha}
            className={`flex px-1 py-0.5 hover:bg-muted ${
              commit.sha === selectedBase || commit.sha === selectedHead ? "bg-accent/10" : ""
            }`}
          >
            <div className="flex items-center gap-0.5 flex-1 min-w-0">
              {showCheckboxes && (
                <div className="pl-0.5 pr-1">
                  <Checkbox
                    checked={selectedCommits.includes(commit.sha)}
                    disabled={selectedCommits.length === 2 && !selectedCommits.includes(commit.sha)}
                    onCheckedChange={() => onCheckboxChange(commit.sha)}
                    aria-label={`Select commit ${commit.sha}`}
                  />
                </div>
              )}

              <div className="flex-1 min-w-0 leading-tight">
                <div className="flex items-center gap-0.5">
                  <a
                    href={`#commit-${commit.sha}`}
                    title={commit.message}
                    className="flex-1 truncate hover:underline text-xs"
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
