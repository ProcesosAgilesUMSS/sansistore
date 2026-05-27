import RejectedOrdersPanel from './RejectedOrdersPanel';

export default function AssignOrdersPanel(props: { embedded?: boolean }) {
  return <RejectedOrdersPanel embedded={props.embedded} />;
}
