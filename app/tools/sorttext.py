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
		page = re.sub(r'\[\[(File|Image):[^\]]+\[\[.*\]\]', "[[File:", page)
		page = re.sub(r'\[\[(File|Image):[^\]]+\[\[.*\]\]', "[[File:", page)
		page = re.sub(r'\[\[(File|Image):[^\]]+\]\]', "", page)
		
		page = re.sub(r'\{\{[^\}]+\-stub\}\}\n?', "", page)
		
		
		page = re.sub(r'<!--.*-->', "", page)
		page = re.sub(r'\[\[Category:.*?\]\]', "", page)
		page = re.sub(r'<ref( \w+=.*)?>[^\<\>]*</ref>', "", page)
		page = re.sub(r'\[\[\s*[a-z]{2,3}(-[a-z]{1,3}(-[a-z]{1,3})?)?:.*\]\]\s*', "", page)
		page = re.sub(r'<!--[^>]*?-->', "", page)
		#page = re.sub(r'([^\[])\[([a-z]+:[^ ]+?) ([^\]]+)\]([^\]])', "---------\1\3\4-------------", page)
		page = re.sub(r'\|\s*[\w_]+\s*=\s*\n', "", page)
		mx = re.search(r'={1,4}\s*?references\s*?={1,4}', page, re.IGNORECASE)
		if mx is not None: page = page[0: mx.start(0)]
		mx = re.search(r'={1,4}\s*?sources\s*?={1,4}', page, re.IGNORECASE)
		if mx is not None: page = page[0: mx.start(0)]
		mx = re.search(r'={1,4}\s*?other websites\s*?={1,4}', page, re.IGNORECASE)
		if mx is not None: page = page[0: mx.start(0)]
		mx = re.search(r'={1,4}\s*?external links\s*?={1,4}', page, re.IGNORECASE)
		if mx is not None: page = page[0: mx.start(0)]
		page = page.strip()
		if re.match("^\{\{.+\}\}$", page) != None:
			#print page
			continue
			
		page = re.sub(r'\{\{[^\}]+\}\}\n?', "", page) #remove all templates
		
		page = re.sub(r'\n\n+', "\n\n", page) #remove all excessive newlines
		
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
