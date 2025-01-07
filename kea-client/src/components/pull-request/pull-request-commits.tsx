import { CheckIcon, GitCompareIcon, XIcon } from "@primer/octicons-react";
import { Avatar, Box, ButtonGroup, IconButton } from "@primer/react";
import { useNavigate } from "@tanstack/react-router";
import { FC, ReactElement, useState } from "react";
import styled from "styled-components";
import * as apiTypes from "~/api/types";
import { Checkbox } from "~/components/checkbox";
import { trimSha } from "~/utils/git";
import { PullRequestDetailsParams } from "~/utils/validate-routes";

const Link = styled.a`
  color: inherit;
  text-decoration: none;

  &:hover {
    color: inherit;
    text-decoration: underline;
  }
`;

const iconButtonProps = {
  size: "small",
  variant: "invisible",
} as const;

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
      <IconButton
        {...iconButtonProps}
        icon={XIcon}
        aria-label="Cancel selection"
        onClick={() => {
          setShowCheckboxes(false);
          setSelectedCommits([]);
        }}
      />
    );

    if (selectedCommits.length === 2) {
      buttons = (
        <>
          {cancelButton}
          <IconButton
            {...iconButtonProps}
            icon={CheckIcon}
            aria-label="Compare selected commits"
            onClick={onCompareClick}
          />
        </>
      );
    } else {
      buttons = cancelButton;
    }
  } else {
    buttons = (
      <IconButton
        {...iconButtonProps}
        icon={GitCompareIcon}
        aria-label="Compare commits"
        onClick={() => setShowCheckboxes(true)}
      />
    );
  }

  return (
    <Box
      className={className}
      sx={{
        listStyle: "none",
        m: 0,
        p: 0,
        border: "1px solid",
        borderColor: "border.default",
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 1,
          borderBottom: "1px solid",
          borderColor: "border.default",
          bg: "canvas.subtle",
        }}
      >
        <Box as="h3" sx={{ m: 0, fontSize: 0 }}>
          Commits
        </Box>
        {commits && commits.length > 1 && (
          <ButtonGroup sx={{ display: "flex", mr: -1 }}>{buttons}</ButtonGroup>
        )}
      </Box>

      <Box as="ul" sx={{ m: 0, p: 0 }}>
        {commits?.map((commit) => (
          <Box
            key={commit.sha}
            as="li"
            sx={{
              display: "flex",
              alignItems: "flex-start",
              px: 3,
              py: 1,
              borderBottom: "1px solid",
              borderColor: "border.default",
              bg:
                commit.sha === selectedBase || commit.sha === selectedCompare
                  ? "accent.subtle"
                  : undefined,
              "&:last-child": { borderBottom: "none" },
              "&:hover": { bg: "canvas.subtle" },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0 }}>
              {showCheckboxes && (
                <Checkbox
                  checked={selectedCommits.includes(commit.sha)}
                  disabled={selectedCommits.length === 2 && !selectedCommits.includes(commit.sha)}
                  onCheckedChange={() => onCheckboxChange(commit.sha)}
                  aria-label={`Select commit ${commit.sha}`}
                />
              )}

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                  <Box
                    sx={{
                      flex: 1,
                      fontSize: 0,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <Link href={`#commit-${commit.sha}`} title={commit.message}>
                      {commit.message}
                    </Link>
                  </Box>
                  {commit.sha === headSha && (
                    <Box sx={{ fontSize: 0, color: "fg.muted", px: 1 }}>HEAD</Box>
                  )}
                  {commit.sha === baseSha && (
                    <Box sx={{ fontSize: 0, color: "fg.muted", px: 1 }}>BASE</Box>
                  )}
                  {commit.author && (
                    <Avatar src={commit.author.avatar_url} alt={commit.author.login} size={16} />
                  )}
                </Box>

                <Box sx={{ fontFamily: "mono", fontSize: 0, color: "fg.muted" }}>
                  <Link href={`#commit-${commit.sha}`} title={commit.sha}>
                    {trimSha(commit.sha)}
                  </Link>
                </Box>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
