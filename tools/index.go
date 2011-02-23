package main
import "lzma.googlecode.com/hg"
import "os"
import "fmt"
import "bytes"
import "xml"
import "regexp"
import "strings"

func main() {
  parser := xml.NewParser(os.Stdin) 
  mode := 0
  //var title []byte;
  title := bytes.NewBuffer(make([]byte,0, 0))
  page := bytes.NewBuffer(make([]byte, 0, 0))
  redirects, rerr := os.Open("redirects.txt", os.O_WRONLY, 0666)
  wiki, werr := os.Open("wiki.txt", os.O_WRONLY, 0666)
  zbuf := bytes.NewBuffer(make([]byte, 0, 0))
  zwiki := lzma.NewWriterLevel(zbuf, 3)
  unsorted, uerr := os.Open("unsorted.txt", os.O_WRONLY, 0666)
  if rerr != nil { fmt.Printf("Error %s\n", rerr); os.Exit(1) }
  if werr != nil { fmt.Printf("Error %s\n", werr); os.Exit(1) }
  if uerr != nil { fmt.Printf("Error %s\n", uerr); os.Exit(1) }
  var redirectFinder = regexp.MustCompile(`#REDIRECT.*\[\[([^\]]+)\]\]`)
  var nsFinder = regexp.MustCompile(`.+:`)
  for { 
    token, err := parser.Token()
    if err == nil {
      switch t := token.(type) {
        case xml.StartElement:
          //fmt.Printf("Start Element %s\n", t.Name.Local)
          if t.Name.Local == "title" {
            mode = 1
          }else if t.Name.Local == "text" {
            mode = 2
          }else{
            mode = 0
          }
        case xml.EndElement:
          //fmt.Printf("End Element %s\n", t.Name.Local)
          if t.Name.Local == "page" {
            stitle := strings.Trim(title.String(), " \n\t\r")
            text := strings.Trim(page.String(), " \n\t\r")
            if !nsFinder.MatchString(stitle){
              if redirectFinder.MatchString(text) {
                //its a redirect!
                fmt.Fprintf(redirects, "%s;%s\n", redirectFinder.FindStringSubmatch(text)[1], stitle)
              }else{
                fmt.Fprintf(unsorted, "%s\n", stitle)
              }
              if zbuf.Len() + len(text) > 30000 {
                fmt.Printf("(%s %d)\n", stitle, zbuf.Len())
                zwiki.Close()
                wiki.Write(zbuf.Bytes())
                //wiki.Sync()
                zbuf.Reset()
                zwiki = lzma.NewWriterLevel(zbuf, 3)
              }
              fmt.Fprintf(zwiki, "=%s=\n\n\n\n%s", stitle, text)
            }
            title.Reset()
            page.Reset()
            
          }
        case xml.CharData:
          if mode == 1 {
            title.Write(t)
          }else if mode == 2 {
            page.Write(t)
          }
          
      }
    }else{
      os.Exit(0)
    }
  }
}
