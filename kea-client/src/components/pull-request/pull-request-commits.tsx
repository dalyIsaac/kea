import { Avatar } from "@primer/react";
import { FC } from "react";
import styled from "styled-components";
import * as apiTypes from "~/api/types";

const CommitContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
`;

const MessageRow = styled.div`
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const CommitRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  margin-bottom: 2px;

  ${MessageRow} {
    flex: 1;
    min-width: 0;
  }
`;

const ShaRow = styled.div`
  display: flex;
  align-items: center;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: #57606a;
  line-height: 1;
`;

const CommitLink = styled.a`
  color: #24292f;
  text-decoration: none;

  &:hover {
    color: #0969da;
    text-decoration: underline;
  }
`;

const CommitList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid #d0d7de;
  border-radius: 6px;

  h3 {
    margin: 0;
    padding: 3px 12px;
    font-size: 12px;
    border-bottom: 1px solid #d0d7de;
    background-color: #f6f8fa;
  }

  li {
    border-bottom: 1px solid #d0d7de;
    padding: 4px 12px;
  }

  li:last-child {
    border-bottom: none;
  }

  a {
    text-decoration: none;
  }

  li:hover {
    background-color: #f6f8fa;
  }

  img {
    flex-shrink: 0;
  }
`;

export const PullRequestCommits: FC<{
  className?: string;
  commits: apiTypes.Commit[] | undefined;
}> = ({ className, commits }) => {
  const formatSha = (sha: string) => sha.substring(0, 7);

  return (
    <CommitList className={className}>
      <h3>Commits</h3>
      {commits?.map((commit) => (
        <li key={commit.sha}>
          <CommitContent>
            <CommitRow>
              <MessageRow>
                <CommitLink
                  href={`#commit-${commit.sha}`}
                  title={commit.message}
                >
                  {commit.message}
                </CommitLink>
              </MessageRow>
              {commit.author && (
                <Avatar
                  src={commit.author.avatar_url}
                  alt={commit.author.login}
                  size={16}
                />
              )}
            </CommitRow>
            <ShaRow>
              <CommitLink href={`#commit-${commit.sha}`} title={commit.sha}>
                {formatSha(commit.sha)}
              </CommitLink>
            </ShaRow>
          </CommitContent>
        </li>
      ))}
    </CommitList>
  );
};
