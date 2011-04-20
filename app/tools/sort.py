index = open('unsorted.txt', 'r')
merged = index.readlines()
print "sorting"
merged.sort(lambda y, x: cmp((y.split("|")[0]),(x.split("|")[0])))
print "writing"
out = open('sortedindex.txt','w')
out.writelines(merged)
out.close()
