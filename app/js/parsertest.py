import sys, re
page = sys.stdin.read()

page = re.sub('<ref[^\0]*?\/(ref)?\>', '', page)
page = re.sub('<gallery>[^\0]*?<\/gallery>', '', page)
page = re.sub('<!--.*?-->', '', page)
page = re.sub('<!--[^\0]*?-->', '', page)

page = re.sub(re.compile('\[\[\s*(File|Image)\s*:[^\]\[]*\[\[[^\[\]]*\]\]', re.IGNORECASE), '[[File:', page)
page = re.sub(re.compile('\[\[\s*(File|Image)\s*:[^\]\[]*\[\[[^\[\]]*\]\]', re.IGNORECASE), '[[File:', page)
page = re.sub(re.compile('\[\[\s*(File|Image)\s*:[^\]\[]*\[\[[^\[\]]*\]\]', re.IGNORECASE), '[[File:', page)
page = re.sub(re.compile('\[\[\s*(File|Image)\s*:[^\]\[]*\[\[[^\[\]]*\]\]', re.IGNORECASE), '[[File:', page)
page = re.sub(re.compile('\[\[\s*(File|Image)\s*:[^\]\[]*\[\[[^\[\]]*\]\]', re.IGNORECASE), '[[File:', page)
page = re.sub(re.compile('\[\[\s*(File|Image)\s*:[^\]\[]*\[\[[^\[\]]*\]\]', re.IGNORECASE), '[[File:', page)

page = re.sub('\[\[\s*(File|Image)\s*:[^\]]*\]\]', '', page)

page = re.sub('\{\{As of\|(\d*)(\|.*?)?\}\}', 'As of \g<1>', page)

page = re.sub('\{\{[^\}\{]*\{\{[^\{\}]*\}\}', '{{', page)
page = re.sub('\{\{[^\}\{]*\{\{[^\{\}]*\}\}', '{{', page)
page = re.sub('\{\{[^\}\{]*\{\{[^\{\}]*\}\}', '{{', page)
page = re.sub('\{\{[^\}\{]*\{\{[^\{\}]*\}\}', '{{', page)
page = re.sub('\{\{[^\}\{]*\{\{[^\{\}]*\}\}', '{{', page)
page = re.sub('\{\{[^\}\{]*\{\{[^\{\}]*\}\}', '{{', page)
page = re.sub('\{\{[^\}\{]*\{\{[^\{\}]*\}\}', '{{', page)
page = re.sub('\{\{[^\}\{]*\{\{[^\{\}]*\}\}', '{{', page)
page = re.sub('\{\{[^\}\{]*\{\{[^\{\}]*\}\}', '{{', page)

page = re.sub('\s*\{\{[^\}\{]*\}\}', '', page)
page = re.sub('\[\[\s*[a-z\-]+\s*:[^\n\|]*?\]\]', '', page)
page = re.sub(re.compile('\[\[Category\s*:\s*.*?\]\]', re.IGNORECASE), '', page)

page = re.sub('\n(\s?\n)+', '\n\n', page)
page = re.sub('[\n\s]+(={2,6})\s*(.*?)\s*(={2,6})[\n\s]+', '\n\g<1>\g<2>\g<3>\n', page)

page = re.sub(re.compile('={2,6}\s*(References|Sources|Other Websites|External Links|Notes|Footnotes|Further Reading)\s*={2,6}[^\0]+', re.IGNORECASE), '', page)

page = page.strip()

print page
