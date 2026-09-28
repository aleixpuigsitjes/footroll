"""Generate the simple code-native Footroll mark without external dependencies."""
import struct, zlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'simulator'/'public'
for size in (192,512):
    rows=[]
    for y in range(size):
        row=bytearray([0])
        for x in range(size):
            u,v=x*192/size,y*192/size
            mark=(50<=u<77 and 49<=v<143) or (50<=u<144 and 49<=v<72) or (50<=u<131 and 90<=v<112) or ((u-135)**2+(v-132)**2<13**2)
            row.extend((219,237,179) if mark else (23,62,50))
        rows.append(row)
    def chunk(kind,data):
        return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(rows)))+chunk(b'IEND',b'')
    (root/f'icon-{size}.png').write_bytes(png)
