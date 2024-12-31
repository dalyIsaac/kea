import { Component } from "solid-js";
import { Accounts } from "./accounts";

export const Settings: Component = () => {
  return (
    <div class="flex flex-col gap-2 p-8">
      <h1 class="text-xl font-bold">Settings</h1>

      <div class="lg:grid-col flex items-start justify-center gap-6 rounded-lg md:grid">
        <div class="col-span-2 grid items-start gap-6 lg:col-span-1">
          <Accounts />
        </div>
      </div>
    </div>
  );
};
