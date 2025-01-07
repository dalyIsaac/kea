import { CheckIcon, GitCompareIcon, XIcon } from "@primer/octicons-react";
import { Avatar, Box, ButtonGroup, IconButton } from "@primer/react";
import { FC, ReactElement, useState } from "react";
import styled from "styled-components";
import * as apiTypes from "~/api/types";
import { Checkbox } from "~/components/checkbox";

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
}> = ({ className, commits }) => {
  const formatSha = (sha: string) => sha.substring(0, 7);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [selectedCommits, setSelectedCommits] = useState<string[]>([]);

  const onCheckboxChange = (sha: string) => {
    setSelectedCommits((prevSelectedCommits) => {
      if (prevSelectedCommits.includes(sha)) {
        return prevSelectedCommits.filter((selectedSha) => selectedSha !== sha);
      } else {
        return [...prevSelectedCommits, sha];
      }
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
          <IconButton {...iconButtonProps} icon={CheckIcon} aria-label="Compare selected commits" />
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

      <Box as="ul">
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
                  {commit.author && (
                    <Avatar src={commit.author.avatar_url} alt={commit.author.login} size={16} />
                  )}
                </Box>

                <Box sx={{ fontFamily: "mono", fontSize: 0, color: "fg.muted" }}>
                  <Link href={`#commit-${commit.sha}`} title={commit.sha}>
                    {formatSha(commit.sha)}
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
