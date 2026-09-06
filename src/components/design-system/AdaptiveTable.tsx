import React from 'react';

interface AdaptiveTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /** Comparison matrices retain their two-dimensional relationship on phones. */
  essential?: boolean;
}
function textOf(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return React.Children.toArray(node).map(child => React.isValidElement(child) ? textOf(child) : String(child ?? '')).join(' ');
}

/** Preserves table cells, handlers and values; only their mobile presentation changes. */
export const AdaptiveTable: React.FC<AdaptiveTableProps> = ({ children, className = '', essential = false, ...props }) => {
  const sections = React.Children.toArray(children);
  const labels: string[] = [];
  const collectHeaders = (nodes: React.ReactNode) => React.Children.forEach(nodes, child => {
    if (!React.isValidElement<{ children?: React.ReactNode }>(child)) return;
    if (child.type === 'th') labels.push(textOf(child.props.children).trim());
    else if (child.type === 'thead' || child.type === 'tr' || child.type === React.Fragment) collectHeaders(child.props.children);
  });
  collectHeaders(sections);
  const annotate = (nodes: React.ReactNode): React.ReactNode => React.Children.map(nodes, child => {
    if (!React.isValidElement<Record<string, any>>(child)) return child;
    if (child.type === 'tr') {
      let index = 0;
      const cells = React.Children.map(child.props.children, cell => {
        if (!React.isValidElement<Record<string, any>>(cell)) return cell;
        if (cell.type !== 'td') return cell;
        const label = cell.props.colSpan > 1 ? undefined : labels[index];
        index += cell.props.colSpan || 1;
        return React.cloneElement(cell, { 'data-label': label || undefined, role: 'cell' });
      });
      return React.cloneElement(child, { role: 'row' }, cells);
    }
    if (child.type === 'tbody' || child.type === React.Fragment) return React.cloneElement(child, {}, annotate(child.props.children));
    return child;
  });
  return (
    <div className="adaptive-table-region" data-essential={essential}>
      <p className="table-scroll-hint">برای مشاهده همه ستون‌ها، جدول را به چپ و راست پیمایش کنید.</p>
      <div className="adaptive-table-scroll" role="region" aria-label={props['aria-label'] || 'جدول اطلاعات؛ قابل پیمایش افقی'} tabIndex={0}>
        <table {...props} role="table" data-essential={essential} className={`adaptive-table ${className}`}>
          {annotate(children)}
        </table>
      </div>
    </div>
  );
};
