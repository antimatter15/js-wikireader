action = 0
title = ""
done = 0

unsorted = open("unsorted.txt","w")
uncompressed = open("uncompressed.txt","w")

import htmlentitydefs, re
def slugfy(text, separator = ""):
  ret = ""
  for c in text.lower():
    try:
      ret += htmlentitydefs.codepoint2name[ord(c)]
    except:
      ret += c
  ret = re.sub("([a-zA-Z])(uml|acute|grave|circ|tilde|cedil)", r"\1", ret)
  ret = re.sub("\W", " ", ret)
  ret = re.sub(" +", separator, ret)
  return ret.strip()


def start_element(name, attrs):
	global action
	if name == "title":
		action = 1
	elif name == "text":
		action = 2
		unsorted.write(str(uncompressed.tell())+"|")
		
def end_element(name):
	global action, title, done
	if action == 1:
		unsorted.write(slugfy(title.encode('utf-8')) + "|" + title.encode('utf-8')+"|")
		title = ""
		done += 1
		if done % 1000 == 0:
			print done
	elif name == "text":
		unsorted.write(str(uncompressed.tell())+"\n")
	action = 0
		
		
def char_data(data):
	global action, title
	if action == 1:
		title += data
	elif action == 2:
		uncompressed.write(data.encode('utf-8'))
		
		
import xml.parsers.expat

p = xml.parsers.expat.ParserCreate()

p.buffer_size = 1024 * 1024
p.buffer_text = True

p.StartElementHandler = start_element
p.EndElementHandler = end_element
p.CharacterDataHandler = char_data

import sys
p.ParseFile(sys.stdin)

