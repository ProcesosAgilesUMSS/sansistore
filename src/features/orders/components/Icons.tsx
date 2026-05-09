interface IconProps {
  checked?: boolean;
}

export function CheckBox({ checked }: IconProps) {
  const checkedPath = "M1 1L-3.49691e-07 1L-4.37113e-08 8L1 8L1 9L9 9L9 8L10 8L10 1L9 1L9 -3.93402e-07L1 -4.37114e-08L1 1ZM1 1L9 1L9 8L1 8L1 1ZM7 2L8 2L8 3L7 3L7 2ZM6 4L6 3L7 3L7 4L6 4ZM5 5L5 4L6 4L6 5L5 5ZM4 6L4 5L5 5L5 6L4 6ZM3 6L4 6L4 7L3 7L3 6ZM3 6L2 6L2 5L3 5L3 6Z";
  const uncheckedPath = "M1 1L-3.49691e-07 1L-4.37113e-08 8L1 8L1 9L9 9L9 8L10 8L10 1L9 1L9 -3.93402e-07L1 -4.37114e-08L1 1ZM1 1L9 1L9 8L1 8L1 1Z";

  return (
    <svg
      width="15"
      height="14"
      viewBox="0 0 10 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Checkbox icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={checked ? checkedPath : uncheckedPath}
        fill="currentColor"
      />
    </svg>
  )
}

export function OpenFolderIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 12 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Folder Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 0H1V1H0V2V3V9H1V10H11V9H12V3H11V2H8V1H7V0ZM11 3V9H1V3H7H8H11ZM7 1V2H1V1H7Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ClosedFolderIcon() {
  return (
    <svg
      viewBox="0 0 12 10"
      width="18"
      height="18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Folder Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 0H7V1H1V0ZM1 6V1H0V9H1V10H11V9H12V3H11V2H8V1H7V2H8V3H11V4H3V5H2V6H1ZM1 7V9H11V5H3V6H2V7H1Z"
        fill="currentColor"
      />
    </svg>
  )
}
