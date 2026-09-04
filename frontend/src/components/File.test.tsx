import {render} from "@testing-library/react";
import {test} from "vitest";
import {File} from "./File.tsx";

test("Renders file component.", async () => {
    render(<File item={"test_folder"} file_event={() => {}} download_file={() => {}}/>)
})
