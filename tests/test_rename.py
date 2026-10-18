import unittest,tempfile,shutil,subprocess,sys,hashlib
from pathlib import Path
class RenameTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)/'file-practice';shutil.copytree(Path(__file__).resolve().parents[1]/'examples/file-practice',self.root)
 def tearDown(self):self.tmp.cleanup()
 def run_code(self,*args):return subprocess.run([sys.executable,str(self.root/'rename_files.py'),*args],capture_output=True,text=True)
 def test_preview_no_changes_and_apply_preserves_bytes(self):
  before={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in self.root.iterdir()};self.assertEqual(self.run_code().returncode,0);self.assertEqual(before,{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in self.root.iterdir()})
  self.assertEqual(self.run_code('--apply').returncode,0);self.assertEqual(hashlib.sha256((self.root/'20261001_사회_설문보고서.txt').read_bytes()).hexdigest(),before['최종보고서.txt']);self.assertTrue((self.root/'rename-log.csv').exists())
 def test_existing_destination_stops_all_changes(self):
  (self.root/'20261005_사회_설문보고서.txt').write_text('keep');self.assertNotEqual(self.run_code('--apply').returncode,0);self.assertTrue((self.root/'최종보고서.txt').exists());self.assertEqual((self.root/'20261005_사회_설문보고서.txt').read_text(),'keep')
 def test_traversal_rejected(self):
  (self.root/'mapping.csv').write_text('old,new\n최종보고서.txt,../escape.txt\n');self.assertNotEqual(self.run_code('--apply').returncode,0);self.assertFalse((self.root.parent/'escape.txt').exists())
if __name__=='__main__':unittest.main()
