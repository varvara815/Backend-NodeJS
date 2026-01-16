import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const styleConfig = {
  fonts: {
    regular: 'Roboto-Regular',
    bold: 'Roboto-Bold',
    italic: 'Roboto-Italic',
    boldItalic: 'Roboto-BoldItalic',
  },
  fontSizes: {
    title: 24,
    metadata: 10,
    content: 12,
    attachmentsHeader: 16,
  },
  colors: {
    text: '#000000',
    metadata: '#666666',
    link: '#0066cc',
  },
};

export const pdfService = {
  // Generates a PDF document for an article and streams it to the output.
  generateArticlePDF(article, stream) {
    const doc = new PDFDocument({
      margin: 50,
    });
    doc.pipe(stream);

    try {
      // Register custom fonts to ensure consistent output.
      const fontDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'fonts');
      doc.registerFont(
        styleConfig.fonts.regular,
        path.join(fontDir, 'roboto-regular-webfont.ttf')
      );
      doc.registerFont(
        styleConfig.fonts.bold,
        path.join(fontDir, 'roboto-bold-webfont.ttf')
      );
      doc.registerFont(
        styleConfig.fonts.italic,
        path.join(fontDir, 'roboto-italic-webfont.ttf')
      );
      doc.registerFont(
        styleConfig.fonts.boldItalic,
        path.join(fontDir, 'roboto-bolditalic-webfont.ttf')
      );

      // Section: Title
      doc
        .font(styleConfig.fonts.bold)
        .fontSize(styleConfig.fontSizes.title)
        .fillColor(styleConfig.colors.text)
        .text(article.title, { align: 'left' });
      doc.moveDown(0.5);

      // Section: Metadata
      doc
        .font(styleConfig.fonts.regular)
        .fontSize(styleConfig.fontSizes.metadata)
        .fillColor(styleConfig.colors.metadata);
      if (article.User?.email) {
        doc.text(`Author: ${article.User.email}`);
        doc.moveDown(0.2);
      }
      if (article.createdAt) {
        doc.text(`Created: ${new Date(article.createdAt).toLocaleString()}`);
        doc.moveDown(0.2);
      }
      if (article.Workspace?.name) {
        doc.text(`Workspace: ${article.Workspace.name}`);
        doc.moveDown(0.2);
      }
      if (article.version_number) {
        doc.text(`Version: ${article.version_number}`);
      }
      doc.moveDown(1);

      // Section: Content
      doc
        .font(styleConfig.fonts.regular)
        .fontSize(styleConfig.fontSizes.content)
        .fillColor(styleConfig.colors.text);
      this.renderHTMLContent(doc, article.content);

      // Section: Attachments
      if (article.attachments && article.attachments.length > 0) {
        const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3001';
        doc.moveDown(2);
        doc
          .font(styleConfig.fonts.bold)
          .fontSize(styleConfig.fontSizes.attachmentsHeader)
          .fillColor(styleConfig.colors.text)
          .text('Attachments:', { align: 'left' });
        doc.moveDown(0.5);

        doc
          .font(styleConfig.fonts.regular)
          .fontSize(styleConfig.fontSizes.content);

        article.attachments.forEach((attachment, index) => {
          const url = `${baseUrl}/uploads/${attachment.filename}`;
          doc
            .fillColor(styleConfig.colors.link)
            .text(`${index + 1}. ${attachment.originalName}`, {
              link: url,
              underline: true,
            });
          doc.moveDown(0.3);
        });
      }

      doc.end();
    } catch (error) {
      console.error(
        `[FATAL] Error during PDF generation for article ${article.id}:`,
        error
      );
      doc.end();
      throw error;
    }
  },

  // Renders basic HTML content to the PDF.
  renderHTMLContent(doc, htmlContent) {
    const content = htmlContent || '';
    this.processContent(doc, content);
  },

  // Splits HTML content into block-level tags (p, ol, ul) and renders them sequentially.
  processContent(doc, content) {
    // Split content by major block tags, keeping the tags for context.
    const blocks = content
      .split(/(<\/?(?:p|ol|ul)[^>]*>)/i)
      .filter((block) => block.trim());

    let inList = false;
    let listType = null; // 'ol' or 'ul'

    for (const block of blocks) {
      if (block.match(/<ol[^>]*>/i)) {
        inList = true;
        listType = 'ol';
        doc.moveDown(0.5);
      } else if (block.match(/<ul[^>]*>/i)) {
        inList = true;
        listType = 'ul';
        doc.moveDown(0.5);
      } else if (block.match(/<\/(?:ol|ul)>/i)) {
        inList = false;
        listType = null;
        doc.moveDown(0.5);
      } else if (block.match(/<\/?p[^>]*>/i)) {
        // Paragraph tags are mainly for splitting; we handle spacing with moveDown.
        continue;
      } else if (block.trim()) {
        if (inList) {
          this.renderListContent(doc, block, listType);
        } else {
          // Treat content outside of lists as a paragraph.
          this.renderParagraph(doc, block);
          doc.moveDown(0.8);
        }
      }
    }
  },

  // Renders the content of a list (ol, ul) by processing its <li> elements.
  renderListContent(doc, content, listType) {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];

    items.forEach((item, index) => {
      // Strip <li> tags to get the inner content.
      const itemText = item.replace(/<\/?li[^>]*>/gi, '').trim();
      const prefix = listType === 'ol' ? `${index + 1}. ` : '• ';

      // Render each list item as a prefixed paragraph.
      this.renderParagraph(doc, prefix + itemText);
      doc.moveDown(0.3);
    });
  },

  // Renders a single paragraph, processing inline HTML styles like bold, italic, and links.
  renderParagraph(doc, paragraph) {
    if (!paragraph || !paragraph.trim()) return;

    // Tokenize the paragraph to handle inline formatting.
    const tokens = this.parseInlineHTML(paragraph);
    if (tokens.length === 0) return;

    // Render each token sequentially, applying styles as needed.
    tokens.forEach((token, index) => {
      if (token.type === 'text' && token.content) {
        // Apply font styles based on the token's style information.
        if (token.styles.bold && token.styles.italic)
          doc.font(styleConfig.fonts.boldItalic);
        else if (token.styles.bold) doc.font(styleConfig.fonts.bold);
        else if (token.styles.italic) doc.font(styleConfig.fonts.italic);
        else doc.font(styleConfig.fonts.regular);

        const isLastToken = index === tokens.length - 1;

        // Apply color and link attributes. The 'continued' flag prevents unwanted line breaks.
        doc
          .fillColor(
            token.styles.link
              ? styleConfig.colors.link
              : styleConfig.colors.text
          )
          .text(token.content, {
            link: token.styles.link,
            underline: !!token.styles.link,
            continued: !isLastToken,
          });
      } else if (token.type === 'br') {
        doc.moveDown(); // Handle <br> tags.
      }
    });
  },

  // A mini-parser that tokenizes a string of HTML into an array of text and style elements.
  parseInlineHTML(html) {
    const tokens = [];
    const styleStack = [{ bold: false, italic: false, link: null }];

    // Regex to split the HTML by supported inline tags.
    const parts = html.split(/(<\/?(?:strong|b|em|i|a|br)[^>]*>)/i);

    const getCurrentStyles = () => ({ ...styleStack[styleStack.length - 1] });

    parts.forEach((part) => {
      if (!part) return;

      const isTag = part.startsWith('<') && part.endsWith('>');

      if (isTag) {
        const isClosing = part.startsWith('</');
        const tagNameMatch = part.match(/<\/?([a-zA-Z0-9]+)/);
        const tag = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';

        // Manage the style stack based on opening/closing tags.
        switch (tag) {
          case 'strong':
          case 'b':
            if (isClosing) {
              if (styleStack.length > 1) styleStack.pop();
            } else {
              styleStack.push({ ...getCurrentStyles(), bold: true });
            }
            break;
          case 'em':
          case 'i':
            if (isClosing) {
              if (styleStack.length > 1) styleStack.pop();
            } else {
              styleStack.push({ ...getCurrentStyles(), italic: true });
            }
            break;
          case 'a':
            if (isClosing) {
              if (styleStack.length > 1) styleStack.pop();
            } else {
              const hrefMatch = part.match(/href=["']([^"']*)["']/);
              styleStack.push({
                ...getCurrentStyles(),
                link: hrefMatch ? hrefMatch[1] : null,
              });
            }
            break;
          case 'br':
            tokens.push({ type: 'br' });
            break;
        }
      } else {
        // If not a tag, it's text content.
        const cleanedText = this.cleanText(part);
        if (cleanedText) {
          tokens.push({
            type: 'text',
            content: cleanedText,
            styles: getCurrentStyles(),
          });
        }
      }
    });

    return tokens;
  },

  // Decodes common HTML entities to their character equivalents.
  cleanText(text) {
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
  },
};
