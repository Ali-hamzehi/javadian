import React, { useId } from 'react';

/** Associates a legacy visible label with its single native control, using a
 * per-instance ID. Field values and event handlers pass through unchanged. */
export const FieldGroup: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => {
  const generated = useId();
  let existingId: string | undefined;
  const find = (nodes: React.ReactNode) => React.Children.forEach(nodes, child => {
    if (!React.isValidElement<Record<string, any>>(child)) return;
    if (typeof child.type === 'string' && ['input', 'select', 'textarea'].includes(child.type)) existingId = child.props.id;
    else if (typeof child.type === 'string' || child.type === React.Fragment) find(child.props.children);
  });
  find(children);
  const id = existingId || `control-${generated}`;
  const connect = (nodes: React.ReactNode): React.ReactNode => React.Children.map(nodes, child => {
    if (!React.isValidElement<Record<string, any>>(child)) return child;
    if (child.type === 'label') return React.cloneElement(child, { htmlFor: id });
    if (typeof child.type === 'string' && ['input', 'select', 'textarea'].includes(child.type)) return React.cloneElement(child, { id });
    if (typeof child.type === 'string' || child.type === React.Fragment) return React.cloneElement(child, {}, connect(child.props.children));
    return child;
  });
  return <div {...props}>{connect(children)}</div>;
};
