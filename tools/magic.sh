stat --printf=%020s wikidata.txt > metasize.txt
stat --printf=%020s index.txt > indexsize.txt
cat metasize.txt indexsize.txt wikidata.txt index.txt wiki.lzma > omni.dump
rm metasize.txt
rm indexsize.txt
