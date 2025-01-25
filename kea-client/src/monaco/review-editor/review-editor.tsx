import React from "react";
import { DiffEntry, ReviewComment } from "~/api/types";
import { InlineLoaderIcon } from "~/components/icons/inline-loader-icon";
import { Editor } from "~/monaco";
import "~/monaco/monaco-worker";
import { selectSelectedNode } from "~/state/file-tree/selectors";
import { useKeaSelector } from "~/state/store";
import { getOriginalFilename } from "~/utils/git";
import { RepoParams } from "~/utils/routes";
import { ReviewModelStore } from "./review-model-store";
import { useFileQuery } from "./use-file-query";

export interface DiffViewerProps extends RepoParams {
  originalRef: string | undefined;
  modifiedRef: string | undefined;
  comments: ReviewComment[] | undefined;
  diffEntries: DiffEntry[] | undefined;
}

export const ReviewEditor: React.FC<DiffViewerProps> = ({
  owner,
  repo,
  originalRef,
  modifiedRef,
  comments,
  diffEntries,
}) => {
  const selectedNode = useKeaSelector(selectSelectedNode);

  const isAdded = selectedNode?.entry.status === "Added";
  const isDeleted = selectedNode?.entry.status === "Removed";

  const [editor, setEditor] = React.useState<Editor | null>(null);
  const monacoElRef = React.useRef<HTMLDivElement | null>(null);

  const reviewStore = ReviewModelStore.get(modifiedRef, diffEntries);
  const model = reviewStore?.getModel(selectedNode?.entry.current_filename);

  useFileQuery(
    owner,
    repo,
    originalRef,
    getOriginalFilename(selectedNode?.entry),
    !isAdded,
    model?.original?.textModel,
  );
  useFileQuery(owner, repo, modifiedRef, selectedNode?.entry.current_filename, !isDeleted, model?.modified?.textModel);

  React.useEffect(() => {
    setEditor((editor) => {
      if (!monacoElRef.current || !model) {
        editor?.dispose();
        return null;
      }

      return model.apply(editor, monacoElRef.current);
    });
  }, [model]);

  React.useEffect(() => {
    const onResize = () => editor?.layout();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [editor]);

  if (!model) {
    return null;
  }

  let editorHeader: React.ReactNode = null;
  if (isAdded) {
    editorHeader = (
      <SingleReviewEditorHeader
        filename={selectedNode?.entry.current_filename}
        hasContentLoaded={!!model.modified?.textModel}
      />
    );
  } else if (isDeleted) {
    editorHeader = (
      <SingleReviewEditorHeader
        filename={getOriginalFilename(selectedNode?.entry)}
        hasContentLoaded={!!model.original?.textModel}
      />
    );
  } else {
    editorHeader = (
      <MultiReviewEditorHeader
        original={{ filename: getOriginalFilename(selectedNode?.entry), hasContentLoaded: !!model.original?.textModel }}
        modified={{ filename: selectedNode?.entry.current_filename, hasContentLoaded: !!model.modified?.textModel }}
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="px-4 py-1 text-sm">{editorHeader}</div>

      <div ref={monacoElRef} className="h-full w-full" />
    </div>
  );
};

interface LoadingProps {
  filename: string | undefined | null;
  hasContentLoaded: boolean;
}

const SingleReviewEditorHeader: React.FC<LoadingProps> = ({ filename, hasContentLoaded }) => (
  <div className="flex items-center">
    {filename ?? "Untitled"}
    <Loading filename={filename} hasContentLoaded={hasContentLoaded} />
  </div>
);

const MultiReviewEditorHeader: React.FC<{ original: LoadingProps; modified: LoadingProps }> = ({
  original,
  modified,
}) => {
  const originalFilename = original.filename ?? modified.filename;

  return (
    <div className="flex flex-col justify-between md:flex-row">
      <div className="flex items-center">
        {originalFilename ?? "(Added)"}
        <Loading filename={originalFilename} hasContentLoaded={original.hasContentLoaded} />
      </div>
      <div className="flex items-center">
        {modified.filename ?? "(Removed)"}
        <Loading filename={modified.filename} hasContentLoaded={modified.hasContentLoaded} />
      </div>
    </div>
  );
};

const Loading: React.FC<LoadingProps> = ({ filename, hasContentLoaded }) => {
  if (!filename || hasContentLoaded) {
    return null;
  }

  return <InlineLoaderIcon className="ml-2" />;
};
