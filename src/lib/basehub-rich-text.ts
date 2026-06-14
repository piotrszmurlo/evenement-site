interface RichTextMark {
  type?: string;
  attrs?: {
    href?: string;
    target?: string;
    rel?: string;
  };
}

interface RichTextNode {
  type?: string;
  text?: string;
  attrs?: {
    level?: number;
    href?: string;
    target?: string;
    rel?: string;
  };
  marks?: RichTextMark[];
  content?: RichTextNode[];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

function renderChildren(nodes?: RichTextNode[]): string {
  if (!Array.isArray(nodes)) {
    return '';
  }

  return nodes.map((node) => renderNode(node)).join('');
}

function renderText(node: RichTextNode): string {
  let html = escapeHtml(node.text ?? '');

  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case 'bold':
        html = `<strong>${html}</strong>`;
        break;
      case 'italic':
        html = `<em>${html}</em>`;
        break;
      case 'underline':
        html = `<u>${html}</u>`;
        break;
      case 'strike':
        html = `<s>${html}</s>`;
        break;
      case 'code':
        html = `<code>${html}</code>`;
        break;
      case 'link': {
        const href = mark.attrs?.href;
        if (!href) break;

        const target = mark.attrs?.target ? ` target="${escapeAttribute(mark.attrs.target)}"` : '';
        const rel = mark.attrs?.rel ? ` rel="${escapeAttribute(mark.attrs.rel)}"` : '';
        html = `<a href="${escapeAttribute(href)}"${target}${rel}>${html}</a>`;
        break;
      }
      default:
        break;
    }
  }

  return html;
}

function renderNode(node: RichTextNode): string {
  switch (node.type) {
    case 'doc':
      return renderChildren(node.content);
    case 'paragraph':
      return `<p>${renderChildren(node.content)}</p>`;
    case 'heading': {
      const level = Math.min(Math.max(node.attrs?.level ?? 2, 1), 6);
      return `<h${level}>${renderChildren(node.content)}</h${level}>`;
    }
    case 'bulletList':
      return `<ul>${renderChildren(node.content)}</ul>`;
    case 'orderedList':
      return `<ol>${renderChildren(node.content)}</ol>`;
    case 'listItem':
      return `<li>${renderChildren(node.content)}</li>`;
    case 'blockquote':
      return `<blockquote>${renderChildren(node.content)}</blockquote>`;
    case 'horizontalRule':
      return '<hr />';
    case 'hardBreak':
      return '<br />';
    case 'text':
      return renderText(node);
    default:
      return renderChildren(node.content);
  }
}

export interface BasehubRichTextDocument {
  json?: {
    content?: RichTextNode[];
    blocks?: unknown[];
  } | null;
}

export function renderBasehubRichText(document?: BasehubRichTextDocument | null): string {
  const content = document?.json?.content;

  if (!Array.isArray(content) || content.length === 0) {
    return '';
  }

  return content.map((node) => renderNode(node)).join('');
}
