interface Props {
  title: string;
  description: string;
}
export const Header = ({ title, description }: Props) => {
  return (
    <header className="mb-8 px-6 py-6">
      <h1
        className="text-2xl font-black text-(--theme-text) sm:text-2xl"
      >
        {title}
      </h1>

      <p className="mt-2 max-w-2xl text-sm leading-relaxed font-semibold text-(--theme-text) opacity-70 md:text-base">
        {description}
      </p>
    </header>
  )
}
