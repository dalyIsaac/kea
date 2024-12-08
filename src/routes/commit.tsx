import { useParams } from "@solidjs/router";
import { SolidQueryDevtools } from "@tanstack/solid-query-devtools";
import { Component, createEffect, createSignal, Show } from "solid-js";
import { FileTree } from "~/components/common/file-tree";
import { Page } from "~/components/common/page";
import { MonacoDiffEditor } from "~/components/editor/monaco-diff-editor";
import {
  ComboboxContent,
  ComboboxControl,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxItemLabel,
  Combobox,
  ComboboxTrigger,
} from "~/components/shadcn/combobox";
import { createCommitQuery, createFileContentQuery } from "~/queries";
import { CommiteRouteFileParams, CommitRouteParams } from "~/routes";

const Commit: Component = () => {
  const params = useParams<CommitRouteParams | CommiteRouteFileParams>();
  const paramsFn = () => params;
  const commit = () => params.commit;
  const file = (): string | undefined => params.file;

  const commitQuery = createCommitQuery(paramsFn, commit);

  const allParents = () =>
    commitQuery.data?.data.parents.map((parent) => parent.sha) ?? [];

  const [parentSha, setParent] = createSignal("");

  createEffect(() => {
    if (parentSha() !== "") {
      return;
    }

    const parents = allParents();
    if (parents.length === 1) {
      setParent(parents[0]);
    }
  });

  const parentFileContentQuery = createFileContentQuery(
    paramsFn,
    parentSha,
    file,
  );
  const modifiedFileContentQuery = createFileContentQuery(
    paramsFn,
    commit,
    file,
  );

  return (
    <div class="flex gap-2">
      <SolidQueryDevtools initialIsOpen />

      <FileTree files={commitQuery.data?.data.files ?? []} />

      <div class="flex w-full flex-col">
        <Combobox
          options={allParents()}
          placeholder="Select parent..."
          value={parentSha()}
          itemComponent={(props) => (
            <ComboboxItem item={props.item}>
              <ComboboxItemLabel>{props.item.rawValue}</ComboboxItemLabel>
              <ComboboxItemIndicator />
            </ComboboxItem>
          )}
        >
          <ComboboxControl aria-label="Parent">
            <ComboboxInput />
            <ComboboxTrigger />
          </ComboboxControl>

          <ComboboxContent />
        </Combobox>

        <Show when={file()} fallback={<div>Select a file</div>}>
          <MonacoDiffEditor
            original={parentFileContentQuery.data ?? ""}
            modified={modifiedFileContentQuery.data ?? ""}
            options={{
              readOnly: true,
            }}
          />
        </Show>
      </div>
    </div>
  );
};

const CommitRoute = () => (
  <Page>
    <Commit />
  </Page>
);

export default CommitRoute;
