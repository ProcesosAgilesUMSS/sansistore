import { SectionHeader } from './SectionHeader';

interface Props {
  title: string;
  description: string;
}

/** Encabezado de sección del vendedor. Delega en SectionHeader para mantener
 *  un único estilo de encabezado en toda la app. */
export const Header = ({ title, description }: Props) => {
  return <SectionHeader title={title} subtitle={description} />;
};
