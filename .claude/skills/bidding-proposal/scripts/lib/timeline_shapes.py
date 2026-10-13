"""The drawing vocabulary a schedule chart is made of.

One place for what the template's timeline slides are built from — the red, the
pale chip, the dotted month rule, the arrow, the dated dot, the grey panel — so
`timeline_layouts` can compose charts out of them without restating a single
colour or inset. Every value here is read off template slides 42 and 46.
"""
from __future__ import annotations

from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Emu, Pt

EMU_IN = 914400

RED = RGBColor(0xFF, 0x22, 0x00)
CHIP_FILL = RGBColor(0xFB, 0xE6, 0xE2)
LANE_ALT_FILL = RGBColor(0xED, 0xE7, 0xDE)
LANE_ALT_TEXT = RGBColor(0xB6, 0x92, 0x56)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
INK = RGBColor(0x3F, 0x3F, 0x3F)
RULE = RGBColor(0x99, 0x99, 0x99)
PANEL_FILL = RGBColor(0xF3, 0xF3, 0xF3)
PANEL_LINE = RGBColor(0xEC, 0xEC, 0xEC)

FONT = 'Noto Sans JP'


def chip(slide, x: float, y: float, w: float, h: float, label: str, font_pt: float,
         fill: RGBColor, ink: RGBColor = RED, arrow: bool = False) -> None:
    """One drawn cell of a chart: the template's arrow chip, or a plain block.

    The arrow (`homePlate`) is the template's own mark for "this runs onward";
    below half an inch, or taller than it is wide, it reads as a broken
    rectangle, so a narrow chip stays rectangular.
    """
    kind = MSO_SHAPE.PENTAGON if arrow and w > max(0.6, h * 1.6) else MSO_SHAPE.RECTANGLE
    shape = slide.shapes.add_shape(kind, Emu(int(x * EMU_IN)), Emu(int(y * EMU_IN)),
                                   Emu(int(max(0.08, w) * EMU_IN)),
                                   Emu(int(max(0.08, h) * EMU_IN)))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.color.rgb = RED if fill == CHIP_FILL else fill
    shape.line.width = Pt(0.75)
    shape.shadow.inherit = False
    write(shape.text_frame, label, font_pt, ink, bold=True)


def text(slide, x: float, y: float, w: float, h: float, body: str, font_pt: float,
         color: RGBColor, bold: bool = False, align=PP_ALIGN.CENTER) -> None:
    box = slide.shapes.add_textbox(Emu(int(x * EMU_IN)), Emu(int(y * EMU_IN)),
                                   Emu(int(w * EMU_IN)), Emu(int(h * EMU_IN)))
    write(box.text_frame, body, font_pt, color, bold=bold, align=align)


def panel(slide, x: float, y: float, w: float, h: float):
    """The template's grey rounded panel, for what sits below a timeline."""
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                   Emu(int(x * EMU_IN)), Emu(int(y * EMU_IN)),
                                   Emu(int(w * EMU_IN)), Emu(int(h * EMU_IN)))
    shape.fill.solid()
    shape.fill.fore_color.rgb = PANEL_FILL
    shape.line.color.rgb = PANEL_LINE
    shape.shadow.inherit = False
    shape.text_frame.text = ''
    return shape


def vline(slide, x: float, y: float, h: float, dotted: bool = False) -> None:
    line = slide.shapes.add_connector(1, Emu(int(x * EMU_IN)), Emu(int(y * EMU_IN)),
                                      Emu(int(x * EMU_IN)), Emu(int((y + h) * EMU_IN)))
    line.line.color.rgb = RULE if dotted else RED
    line.line.width = Pt(0.75)
    if dotted:
        from pptx.oxml.ns import qn
        ln = line.line._get_or_add_ln()
        ln.append(ln.makeelement(qn('a:prstDash'), {'val': 'sysDot'}))


def hline(slide, x: float, y: float, w: float) -> None:
    """The axis itself — the one solid rule on a milestone chart."""
    line = slide.shapes.add_connector(1, Emu(int(x * EMU_IN)), Emu(int(y * EMU_IN)),
                                      Emu(int((x + w) * EMU_IN)), Emu(int(y * EMU_IN)))
    line.line.color.rgb = INK
    line.line.width = Pt(0.75)


def dot(slide, x: float, y: float, size: float = 0.07) -> None:
    """A milestone's mark ON the axis, as slide 42 draws it."""
    mark = slide.shapes.add_shape(MSO_SHAPE.OVAL,
                                  Emu(int((x - size / 2) * EMU_IN)),
                                  Emu(int((y - size / 2) * EMU_IN)),
                                  Emu(int(size * EMU_IN)), Emu(int(size * EMU_IN)))
    mark.fill.solid()
    mark.fill.fore_color.rgb = RED
    mark.line.color.rgb = RED
    mark.shadow.inherit = False


def write(frame, body: str, font_pt: float, color: RGBColor, bold: bool,
          align=PP_ALIGN.CENTER) -> None:
    """Set a frame's text at one size, wrapped, centred in its own box."""
    frame.word_wrap = True
    frame.margin_left = frame.margin_right = Emu(int(0.02 * EMU_IN))
    frame.margin_top = frame.margin_bottom = 0
    frame.vertical_anchor = MSO_ANCHOR.MIDDLE
    lines = str(body).split('\n')
    frame.text = lines[0]
    for extra in lines[1:]:
        frame.add_paragraph().text = extra
    for paragraph in frame.paragraphs:
        paragraph.alignment = align
        for run in paragraph.runs:
            run.font.size = Pt(max(5.0, font_pt))
            run.font.bold = bold
            run.font.color.rgb = color
            run.font.name = FONT
