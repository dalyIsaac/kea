import { Component } from "solid-js";
import { Page } from "~/components/common/page";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/shadcn/text-field";
import { personalAccessToken, setApi } from "~/queries";

const Settings: Component = () => {
  return (
    <div>
      <TextField class="grid w-full max-w-sm items-center gap-1.5">
        <TextFieldLabel for="pat">GitHub Personal Access Token</TextFieldLabel>
        <TextFieldInput
          type="text"
          id="pat"
          placeholder="Personal Access Token"
          value={personalAccessToken()}
          onInput={(e) => setApi(e.currentTarget.value)}
        />
      </TextField>
    </div>
  );
};

const SettingsRoute = () => (
  <Page>
    <Settings />
  </Page>
);

export default SettingsRoute;
