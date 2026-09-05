import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { File } from "./File.tsx";

describe("File", () => {
  test("renders the item name (grid view)", () => {
    render(
      <File
        item="test_folder"
        file_event={() => {}}
        download_file={() => {}}
      />,
    );
    expect(screen.getByText("test_folder")).toBeTruthy();
  });

  test("clicking the item calls file_event with its name", () => {
    const fileEvent = vi.fn();
    const download = vi.fn();
    render(
      <File
        item="report.pdf"
        file_event={fileEvent}
        download_file={download}
      />,
    );

    fireEvent.click(screen.getByText("report.pdf"));

    expect(fileEvent).toHaveBeenCalledTimes(1);
    expect(fileEvent).toHaveBeenCalledWith("report.pdf");
    expect(download).not.toHaveBeenCalled();
  });

  test("clicking the download button calls download_file, not file_event", () => {
    const fileEvent = vi.fn();
    const download = vi.fn();
    render(
      <File
        item="report.pdf"
        file_event={fileEvent}
        download_file={download}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Download report.pdf" }),
    );

    expect(download).toHaveBeenCalledTimes(1);
    expect(download).toHaveBeenCalledWith("report.pdf");
    expect(fileEvent).not.toHaveBeenCalled();
  });

  test("renders nothing for a hidden dotfile", () => {
    const { container } = render(
      <File item=".env" file_event={() => {}} download_file={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders nothing when handlers are missing", () => {
    const { container } = render(
      <File
        item="anything.txt"
        file_event={undefined}
        download_file={undefined}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  test("list view renders the name and a download action", () => {
    const download = vi.fn();
    render(
      <File
        item="photo.png"
        file_event={() => {}}
        download_file={download}
        view="list"
      />,
    );

    expect(screen.getByText("photo.png")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Download photo.png" }));
    expect(download).toHaveBeenCalledWith("photo.png");
  });
});
