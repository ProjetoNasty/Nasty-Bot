
module.exports = class CanvasUtils {

  static drawWrappingText(context, text, x, y, maxWidth) {
    let lines = [];

    let words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = context.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      }
      else {
        line = testLine;
      }
    }

    lines.push(line);
    lines = lines.join("\n").split("\n");

    if (lines.length > 4) {
      lines = lines.slice(0, 4);
    }

    context.fillText(lines.join("\n"), x, y);
  }
};
