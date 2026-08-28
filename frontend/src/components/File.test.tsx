import {render, fireEvent, screen} from "@testing-library/react";
import { expect, test} from "vitest";
import {File} from "./File.tsx";

test("Renders file component.", async () => {
    render(<File item={"test_folder"}/>)
    // await screen.findByRole()
    // await screen.findByRole("button", {name: "extra"});
    //
    // expect(screen.getByRole("button", {name: "extra"}));

})


