import * as apiTypes from "~/api/types";
import { cn } from "~/lib/utils";
import { Avatar } from "~/shadcn/ui/avatar";
import { Checkbox } from "~/shadcn/ui/checkbox";
import { trimSha } from "~/utils/git";

interface CommitItemProps {
  commit: apiTypes.Commit;
  selectedBase?: string;
  selectedHead?: string;
  showCheckboxes: boolean;
  selectedCommits: string[];
  headSha?: string;
  baseSha?: string;
  onCheckboxChange: (sha: string) => void;
}

export const PullRequestCommitsItem: React.FC<CommitItemProps> = ({
  commit,
  selectedBase,
  selectedHead,
  showCheckboxes,
  selectedCommits,
  headSha,
  baseSha,
  onCheckboxChange,
}) => (
  <li
    className={cn(
      "flex px-1 py-0.5 hover:bg-muted",
      (commit.sha === selectedBase || commit.sha === selectedHead) && "bg-accent/10",
    )}
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
            {commit.sha === headSha && <span className="text-xs text-muted-foreground">HEAD</span>}
            {commit.sha === baseSha && <span className="text-xs text-muted-foreground">BASE</span>}
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
);
