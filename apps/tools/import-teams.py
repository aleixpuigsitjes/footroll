"""Import ratings from repository PDFs; player headers were visually verified.
Run with Python + pdfplumber from the repository. Ratings are scaled from /10 to /100.
"""
import json, re
from pathlib import Path
import pdfplumber
root = Path(__file__).resolve().parents[2]
rows = ['Scissor kick','Lob','Finish','Offensive header','Penalty','Shoot','Free kick','Slip','Dribble','Feint','Short pass','Long pass','Corner kick','Throw in','Defensive header','Intercept','Tackle','Mark','Reach','Catch','Deflect','Punch','Hand tackle','Goalkeeper kick','Hand pass','Strength','Shoot power','Header power','Pace']
sources = [
 ('home','FC Barcelona','2014–2015','F.C. Barcelona 2014-2015.pdf',
 ['Ter Stegen','Jordi Alba','Piqué','Alves','Mascherano','Busquets','Iniesta','Rakitic','Messi','Neymar','Luis Suarez','Bravo','Mathieu','Bartra','S. Roberto','Xavi','Rafinha','Pedro'],
 [1,18,3,20,14,28,8,4,10,11,9,13,24,15,20,6,12,7]),
 ('away','Real Madrid','2015–2016','Real Madrid 2015-2016.pdf',
 ['Navas','Marcelo','Ramos','Pepe','Carvajal','Modric','Kroos','Rodríguez','Bale','Benzema','C. Ronaldo','Casilla','Nacho','Varane','Danilo','Casimiro','Isco','Lucas Vázquez'],
 [1,12,4,3,15,19,8,10,11,9,7,13,6,2,23,14,22,18]),
]
result = {}
for side, name, season, filename, names, numbers in sources:
 with pdfplumber.open(root/'teams'/filename) as pdf:
  lines = pdf.pages[0].extract_text().splitlines()
 ratings = {}
 for label in rows:
  matches = [line for line in lines if re.search(r'(?<![\w])'+re.escape(label)+r'\s+\d',line)]
  assert len(matches)==1, (filename,label,matches)
  values = [int(v)*10 for v in re.findall(r'\b\d+\b',matches[0])]
  assert len(values)==18 and all(50<=v<=100 for v in values), (filename,label,values)
  ratings[label]=values
 roles=['Goalkeeper']+['Defender']*4+['Midfielder']*3+['Forward']*3+['Goalkeeper']+['Defender']*3+['Midfielder']*2+['Forward']
 # Roberto is a midfielder in the practice formation; source sheets do not encode roles.
 if side=='home': roles[14]='Midfielder'
 result[side]={'name':name,'season':season,'source':f'teams/{filename}','players':[
  {'id':f'{side}-{i+1}','number':number,'name':player,'role':roles[i],'starter':i<11,'ratings':{label:values[i] for label,values in ratings.items()}}
  for i,(player,number) in enumerate(zip(names,numbers))]}
(root/'apps/packages/engine/src/teams.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
