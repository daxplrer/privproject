export default function(val:BufferSource, label:string){
const dec = new TextDecoder(label)
return dec.decode(val)
}