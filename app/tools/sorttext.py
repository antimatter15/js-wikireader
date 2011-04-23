sort = open('sortedindex.txt', 'r')
text = open('uncompressed.txt', 'r')
out = open('dump.lzma', 'w')
#out2 = open('debug.txt', 'w')
index = open('dump.index', 'w')


import re
import pylzma
import base64

import struct
from cStringIO import StringIO
"""
{dictionarySize: 16, fb: 64,	matchFinder: 0, lc: 3, lp: 0, pb: 2},
{dictionarySize: 20, fb: 64,	matchFinder: 0, lc: 3, lp: 0, pb: 2},
{dictionarySize: 19, fb: 64,	matchFinder: 1, lc: 3, lp: 0, pb: 2},
{dictionarySize: 20, fb: 64,	matchFinder: 1, lc: 3, lp: 0, pb: 2},
{dictionarySize: 21, fb: 128, matchFinder: 1, lc: 3, lp: 0, pb: 2},
{dictionarySize: 22, fb: 128, matchFinder: 1, lc: 3, lp: 0, pb: 2},
{dictionarySize: 23, fb: 128, matchFinder: 1, lc: 3, lp: 0, pb: 2},
{dictionarySize: 24, fb: 255, matchFinder: 1, lc: 3, lp: 0, pb: 2},
{dictionarySize: 25, fb: 255, matchFinder: 1, lc: 3, lp: 0, pb: 2}
"""

def compress_compatible(data):
	#c = pylzma.compressfile(StringIO(data), algorithm = 0, dictionary = 16, fastBytes = 64)
	c = pylzma.compressfile(StringIO(data), algorithm = 1, dictionary = 20, fastBytes = 64)
	# LZMA header
	result = c.read(5)
	# size of uncompressed data
	result += struct.pack('<Q', len(data))
	# compressed data
	return result + c.read()

import string
ALPHABET = string.ascii_uppercase + string.ascii_lowercase + \
           string.digits + '-_'
ALPHABET_REVERSE = dict((c, i) for (i, c) in enumerate(ALPHABET))
BASE = len(ALPHABET)
SIGN_CHARACTER = '$'

#http://stackoverflow.com/questions/561486/how-to-convert-an-integer-to-the-shortest-url-safe-string-in-python
def num_encode(n):
    s = []
    while True:
        n, r = divmod(n, BASE)
        s.append(ALPHABET[r])
        if n == 0: break
    return ''.join(reversed(s))


def num_decode(s):
    n = 0
    for c in s:
        n = n * BASE + ALPHABET_REVERSE[c]
    return n

text_buffer = ""
index_buffer = []
buflen = 0

for line in sort:
	parts = line.split("|")
	title = parts[1]
	start = int(parts[2])
	end = int(parts[3])
	text.seek(start)
	page = text.read(end - start).strip()
	if page == "" or title == "" or re.match("\w+:", title) != None:
		continue
	m = re.match('\#REDIRECT.*\[\[([^\]]+)\]\]', page, re.I)
	if m is not None and re.match("\w+:", m.group(1)) == None:
		index.write(title + ">" + m.group(1) + "\n")
	else:
		window = 100000
		
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

		
		if page == "":
			continue
		
		page = "=" + title + "=\n\n\n\n" + page
	  
		pln = len(page)
		if buflen + pln < window: #split into 100KB chunks
			text_buffer += page
			buflen += pln
			index_buffer.append(title)
			index.write(title + "|" + num_encode(out.tell()) + "\n")
		else:
			#print text_buffer[0:1000]
			#print "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"
			compressed = compress_compatible(text_buffer)
			cln = len(compressed)
			if buflen > window + 10000:
				print "Insanely Huge Block", index_buffer, "Size:", len(text_buffer), "Compressed: ", cln
			out.write(compressed)
			#out2.write(text_buffer)
			index.write(title + "|" + num_encode(out.tell()) + "\n")
			text_buffer = page
			index_buffer = [title]
			buflen = pln
compressed = compress_compatible(text_buffer)
out.write(compressed)
