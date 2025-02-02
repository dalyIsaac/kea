import { useNavigate } from "@tanstack/react-router";
import { Check, GitCompare, X } from "lucide-react";
import { ReactElement, useState } from "react";
import * as apiTypes from "~/api/types";
import { InlineLoaderIcon } from "~/components/icons/inline-loader-icon";
import { Sidebar, SidebarHeader, SidebarTitle } from "~/components/sidebar";
import { Button } from "~/shadcn/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/shadcn/ui/tooltip";
import { createCompare, PullRequestDetailsParams } from "~/utils/routes";
import { PullRequestCommitsItem } from "./pull-request-commits-item";

const ButtonWithTooltip: React.FC<{
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

export const PullRequestCommits: React.FC<{
  commits: apiTypes.Commit[] | undefined;
  params: PullRequestDetailsParams;
  headSha: string | undefined;
  baseSha: string | undefined;
  selectedBase: string | undefined;
  selectedHead: string | undefined;
}> = ({ commits, params, headSha, baseSha, selectedBase, selectedHead }) => {
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

    const [base, head] =
      firstShaIndex < secondShaIndex ? [firstSha, secondSha] : [secondSha, firstSha];

    navigate({
      to: "/$provider/$owner/$repo/pull/$prId/review",
      params,
      search: { compare: createCompare(base, head) },
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
    <Sidebar>
      <SidebarHeader>
        <SidebarTitle>
          Commits
          {commits === undefined && <InlineLoaderIcon className="ml-2" />}
        </SidebarTitle>
        {commits && commits.length > 1 && <div className="-mr-1 flex items-center">{buttons}</div>}
      </SidebarHeader>

      <ul className="divide-y divide-border text-sm">
        {commits?.map((commit) => (
          <PullRequestCommitsItem
            key={commit.sha}
            commit={commit}
            selectedBase={selectedBase}
            selectedHead={selectedHead}
            showCheckboxes={showCheckboxes}
            selectedCommits={selectedCommits}
            headSha={headSha}
            baseSha={baseSha}
            onCheckboxChange={onCheckboxChange}
          />
        ))}
      </ul>
    </Sidebar>
  );
};
