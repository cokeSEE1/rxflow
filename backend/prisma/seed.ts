import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('123456', 10)

  const assistant = await prisma.user.upsert({
    where: { phone: '13800001111' },
    update: {},
    create: { name: '李助理', phone: '13800001111', passwordHash: hash, role: 'assistant' },
  })
  const doctor = await prisma.user.upsert({
    where: { phone: '13800002222' },
    update: {},
    create: { name: '张医生', phone: '13800002222', passwordHash: hash, role: 'doctor' },
  })
  const courier = await prisma.user.upsert({
    where: { phone: '13800003333' },
    update: {},
    create: { name: '王师傅', phone: '13800003333', passwordHash: hash, role: 'courier' },
  })
  const patientUser = await prisma.user.upsert({
    where: { phone: '13800004444' },
    update: {},
    create: { name: '赵建国', phone: '13800004444', passwordHash: hash, role: 'patient' },
  })

  const pharmacist1 = await prisma.user.upsert({
    where: { phone: '13800005555' },
    update: {},
    create: { name: '陈药师', phone: '13800005555', passwordHash: hash, role: 'pharmacist', department: '门诊药房' },
  })
  const pharmacist2 = await prisma.user.upsert({
    where: { phone: '13800006666' },
    update: {},
    create: { name: '刘药师', phone: '13800006666', passwordHash: hash, role: 'pharmacist', department: '住院药房' },
  })

  const patient1 = await prisma.patient.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '赵建国', phone: '13800004444', gender: 'male', age: 62,
      address: '北京市朝阳区望京西园三区 401 号楼 5 单元 302',
      allergyHistory: '青霉素过敏',
      createdBy: assistant.id,
    },
  })

  const patient2 = await prisma.patient.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: '李奶奶', phone: '13900005555', gender: 'female', age: 72,
      address: '北京市海淀区中关村南大街 12 号院 3 号楼 101',
      allergyHistory: '头孢类过敏',
      createdBy: assistant.id,
    },
  })

  // ---- Allergens ----
  const allergens = await Promise.all([
    prisma.allergen.upsert({ where: { id: 1 }, update: {}, create: { name: '青霉素', category: 'antibiotic', description: '青霉素类抗生素，常见过敏原' } }),
    prisma.allergen.upsert({ where: { id: 2 }, update: {}, create: { name: '头孢菌素', category: 'antibiotic', description: '头孢类抗生素，与青霉素有交叉过敏' } }),
    prisma.allergen.upsert({ where: { id: 3 }, update: {}, create: { name: '磺胺', category: 'antibiotic', description: '磺胺类抗菌药' } }),
    prisma.allergen.upsert({ where: { id: 4 }, update: {}, create: { name: '阿司匹林', category: 'antipyretic', description: '水杨酸类解热镇痛药' } }),
    prisma.allergen.upsert({ where: { id: 5 }, update: {}, create: { name: '布洛芬', category: 'antipyretic', description: 'NSAIDs 类抗炎药' } }),
    prisma.allergen.upsert({ where: { id: 6 }, update: {}, create: { name: '对乙酰氨基酚', category: 'antipyretic', description: '解热镇痛药' } }),
    prisma.allergen.upsert({ where: { id: 7 }, update: {}, create: { name: '链霉素', category: 'antibiotic', description: '氨基糖苷类抗生素' } }),
    prisma.allergen.upsert({ where: { id: 8 }, update: {}, create: { name: '胰岛素', category: 'enzyme', description: '降糖激素' } }),
    prisma.allergen.upsert({ where: { id: 9 }, update: {}, create: { name: '碘造影剂', category: 'other', description: '影像学检查用的造影剂' } }),
    prisma.allergen.upsert({ where: { id: 10 }, update: {}, create: { name: '乳胶', category: 'other', description: '天然乳胶制品' } }),
  ])

  // ---- Drug Catalog (50 common drugs) ----
  const drugs = await Promise.all([
    prisma.drug.upsert({ where: { id: 1 }, update: {}, create: { standardName: '硝苯地平控释片', genericName: '硝苯地平', specification: '30mg×7片', manufacturer: '拜耳医药', dosageForm: 'tablet', insuranceCategory: 'A', unit: '盒', referencePrice: 32.5, pinyinInitial: 'xbdp', searchCode: 'xiaobendiping|xbdp' } }),
    prisma.drug.upsert({ where: { id: 2 }, update: {}, create: { standardName: '厄贝沙坦片', genericName: '厄贝沙坦', specification: '150mg×7片', manufacturer: '赛诺菲', dosageForm: 'tablet', insuranceCategory: 'A', unit: '盒', referencePrice: 28.0, pinyinInitial: 'ebst', searchCode: 'eibeishatan|ebst' } }),
    prisma.drug.upsert({ where: { id: 3 }, update: {}, create: { standardName: '阿托伐他汀钙片', genericName: '阿托伐他汀', specification: '20mg×7片', manufacturer: '辉瑞制药', dosageForm: 'tablet', insuranceCategory: 'A', unit: '盒', referencePrice: 45.8, pinyinInitial: 'atftt', searchCode: 'atuofatating|atftt' } }),
    prisma.drug.upsert({ where: { id: 4 }, update: {}, create: { standardName: '盐酸二甲双胍片', genericName: '二甲双胍', specification: '0.5g×20片', manufacturer: '中美史克', dosageForm: 'tablet', insuranceCategory: 'A', unit: '盒', referencePrice: 12.5, pinyinInitial: 'ysejg', searchCode: 'yansuanerjiagua|ys ejg' } }),
    prisma.drug.upsert({ where: { id: 5 }, update: {}, create: { standardName: '阿莫西林胶囊', genericName: '阿莫西林', specification: '0.5g×24粒', manufacturer: '联邦制药', dosageForm: 'capsule', insuranceCategory: 'A', unit: '盒', referencePrice: 15.0, pinyinInitial: 'amxl', searchCode: 'amoxilin|amxl' } }),
    prisma.drug.upsert({ where: { id: 6 }, update: {}, create: { standardName: '布洛芬缓释胶囊', genericName: '布洛芬', specification: '0.3g×20粒', manufacturer: '中美史克', dosageForm: 'capsule', insuranceCategory: 'B', unit: '盒', referencePrice: 18.5, pinyinInitial: 'blf', searchCode: 'buluofen|blf' } }),
    prisma.drug.upsert({ where: { id: 7 }, update: {}, create: { standardName: '复方甘草片', genericName: '复方甘草', specification: '100片/瓶', manufacturer: '国药集团', dosageForm: 'tablet', insuranceCategory: 'A', unit: '瓶', referencePrice: 8.5, pinyinInitial: 'ffgcp', searchCode: 'fufanggancaopian|ffgcp' } }),
    prisma.drug.upsert({ where: { id: 8 }, update: {}, create: { standardName: '头孢拉定胶囊', genericName: '头孢拉定', specification: '0.25g×24粒', manufacturer: '广州白云山', dosageForm: 'capsule', insuranceCategory: 'A', unit: '盒', referencePrice: 22.0, pinyinInitial: 'tbld', searchCode: 'toubaolading|tbld' } }),
    prisma.drug.upsert({ where: { id: 9 }, update: {}, create: { standardName: '缬沙坦胶囊', genericName: '缬沙坦', specification: '80mg×7粒', manufacturer: '诺华制药', dosageForm: 'capsule', insuranceCategory: 'A', unit: '盒', referencePrice: 35.0, pinyinInitial: 'xst', searchCode: 'xieshatan|xst' } }),
    prisma.drug.upsert({ where: { id: 10 }, update: {}, create: { standardName: '阿卡波糖片', genericName: '阿卡波糖', specification: '50mg×30片', manufacturer: '拜耳医药', dosageForm: 'tablet', insuranceCategory: 'A', unit: '盒', referencePrice: 52.0, pinyinInitial: 'akbt', searchCode: 'akabotang|akbt' } }),
    prisma.drug.upsert({ where: { id: 11 }, update: {}, create: { standardName: '氯沙坦钾片', genericName: '氯沙坦', specification: '50mg×7片', manufacturer: '默沙东', dosageForm: 'tablet', insuranceCategory: 'A', unit: '盒', referencePrice: 38.0, pinyinInitial: 'lstj', searchCode: 'lvshantanjia|lstj' } }),
    prisma.drug.upsert({ where: { id: 12 }, update: {}, create: { standardName: '氢氯噻嗪片', genericName: '氢氯噻嗪', specification: '25mg×100片', manufacturer: '上海医药', dosageForm: 'tablet', insuranceCategory: 'A', unit: '瓶', referencePrice: 5.5, pinyinInitial: 'qlsq', searchCode: 'qinglvsaiqin|qlsq' } }),
    prisma.drug.upsert({ where: { id: 13 }, update: {}, create: { standardName: '瑞舒伐他汀钙片', genericName: '瑞舒伐他汀', specification: '10mg×7片', manufacturer: '阿斯利康', dosageForm: 'tablet', insuranceCategory: 'B', unit: '盒', referencePrice: 49.0, pinyinInitial: 'rsftt', searchCode: 'ruishufatating|rsftt' } }),
    prisma.drug.upsert({ where: { id: 14 }, update: {}, create: { standardName: '格列齐特缓释片', genericName: '格列齐特', specification: '30mg×30片', manufacturer: '施维雅', dosageForm: 'tablet', insuranceCategory: 'A', unit: '盒', referencePrice: 42.0, pinyinInitial: 'glqt', searchCode: 'gelieqite|glqt' } }),
    prisma.drug.upsert({ where: { id: 15 }, update: {}, create: { standardName: '氨氯地平片', genericName: '氨氯地平', specification: '5mg×7片', manufacturer: '辉瑞制药', dosageForm: 'tablet', insuranceCategory: 'A', unit: '盒', referencePrice: 26.0, pinyinInitial: 'aldp', searchCode: 'anlvdiping|aldp' } }),
    prisma.drug.upsert({ where: { id: 16 }, update: {}, create: { standardName: '辛伐他汀片', genericName: '辛伐他汀', specification: '20mg×7片', manufacturer: '默沙东', dosageForm: 'tablet', insuranceCategory: 'A', unit: '盒', referencePrice: 25.0, pinyinInitial: 'xftt', searchCode: 'xinfatating|xftt' } }),
    prisma.drug.upsert({ where: { id: 17 }, update: {}, create: { standardName: '奥美拉唑肠溶胶囊', genericName: '奥美拉唑', specification: '20mg×14粒', manufacturer: '阿斯利康', dosageForm: 'capsule', insuranceCategory: 'A', unit: '盒', referencePrice: 36.0, pinyinInitial: 'amlz', searchCode: 'aomeilazuo|amlz' } }),
    prisma.drug.upsert({ where: { id: 18 }, update: {}, create: { standardName: '盐酸氨溴索片', genericName: '氨溴索', specification: '30mg×20片', manufacturer: '勃林格殷格翰', dosageForm: 'tablet', insuranceCategory: 'B', unit: '盒', referencePrice: 22.0, pinyinInitial: 'ysaxs', searchCode: 'yansuananxiusuo|ysaxs' } }),
    prisma.drug.upsert({ where: { id: 19 }, update: {}, create: { standardName: '氯雷他定片', genericName: '氯雷他定', specification: '10mg×6片', manufacturer: '先灵葆雅', dosageForm: 'tablet', insuranceCategory: 'B', unit: '盒', referencePrice: 19.0, pinyinInitial: 'lltd', searchCode: 'lvreitading|lltd' } }),
    prisma.drug.upsert({ where: { id: 20 }, update: {}, create: { standardName: '蒙脱石散', genericName: '蒙脱石', specification: '3g×10袋', manufacturer: '益普生', dosageForm: 'granule', insuranceCategory: 'B', unit: '盒', referencePrice: 16.0, pinyinInitial: 'mtss', searchCode: 'mengtuoshisan|mtss' } }),
    prisma.drug.upsert({ where: { id: 21 }, update: {}, create: { standardName: '左氧氟沙星片', genericName: '左氧氟沙星', specification: '0.5g×10片', manufacturer: '第一三共', dosageForm: 'tablet', insuranceCategory: 'A', unit: '盒', referencePrice: 42.0, pinyinInitial: 'zyfsx', searchCode: 'zuoyangfushaxing|zyfsx' } }),
    prisma.drug.upsert({ where: { id: 22 }, update: {}, create: { standardName: '甲硝唑片', genericName: '甲硝唑', specification: '0.2g×100片', manufacturer: '上海信谊', dosageForm: 'tablet', insuranceCategory: 'A', unit: '瓶', referencePrice: 7.0, pinyinInitial: 'jxz', searchCode: 'jiaxiaozuo|jxz' } }),
    prisma.drug.upsert({ where: { id: 23 }, update: {}, create: { standardName: '雷贝拉唑钠肠溶片', genericName: '雷贝拉唑', specification: '10mg×14片', manufacturer: '卫材', dosageForm: 'tablet', insuranceCategory: 'A', unit: '盒', referencePrice: 42.0, pinyinInitial: 'lblz', searchCode: 'leibeilazuo|lblz' } }),
    prisma.drug.upsert({ where: { id: 24 }, update: {}, create: { standardName: '注射用青霉素钠', genericName: '青霉素', specification: '80万单位/瓶', manufacturer: '华北制药', dosageForm: 'injection', insuranceCategory: 'A', unit: '瓶', referencePrice: 1.5, pinyinInitial: 'zsyqms', searchCode: 'zhusheyongqingmeisu|zsyqms' } }),
    prisma.drug.upsert({ where: { id: 25 }, update: {}, create: { standardName: '头孢克洛干混悬剂', genericName: '头孢克洛', specification: '125mg×6袋', manufacturer: '礼来', dosageForm: 'granule', insuranceCategory: 'A', unit: '盒', referencePrice: 32.0, pinyinInitial: 'tbkl', searchCode: 'toubaokeluo|tbkl' } }),
    prisma.drug.upsert({ where: { id: 26 }, update: {}, create: { standardName: '沙美特罗替卡松粉吸入剂', genericName: '沙美特罗替卡松', specification: '50μg/250μg×60吸', manufacturer: '葛兰素史克', dosageForm: 'spray', insuranceCategory: 'B', unit: '支', referencePrice: 195.0, pinyinInitial: 'smtl', searchCode: 'shameiteluo|smtl' } }),
    prisma.drug.upsert({ where: { id: 27 }, update: {}, create: { standardName: '氯吡格雷片', genericName: '氯吡格雷', specification: '75mg×7片', manufacturer: '赛诺菲', dosageForm: 'tablet', insuranceCategory: 'B', unit: '盒', referencePrice: 72.0, pinyinInitial: 'lbgl', searchCode: 'lvbigelie|lbgl' } }),
    prisma.drug.upsert({ where: { id: 28 }, update: {}, create: { standardName: '华法林钠片', genericName: '华法林', specification: '2.5mg×60片', manufacturer: '芬兰奥利安', dosageForm: 'tablet', insuranceCategory: 'A', unit: '瓶', referencePrice: 38.0, pinyinInitial: 'hfln', searchCode: 'huafalinna|hfln' } }),
    prisma.drug.upsert({ where: { id: 29 }, update: {}, create: { standardName: '地高辛片', genericName: '地高辛', specification: '0.25mg×30片', manufacturer: '上海医药', dosageForm: 'tablet', insuranceCategory: 'A', unit: '盒', referencePrice: 12.0, pinyinInitial: 'dgx', searchCode: 'digaoxin|dgx' } }),
    prisma.drug.upsert({ where: { id: 30 }, update: {}, create: { standardName: '螺内酯片', genericName: '螺内酯', specification: '20mg×100片', manufacturer: '杭州民生', dosageForm: 'tablet', insuranceCategory: 'A', unit: '瓶', referencePrice: 14.0, pinyinInitial: 'lnz', searchCode: 'luoneizhi|lnz' } }),
    prisma.drug.upsert({ where: { id: 31 }, update: {}, create: { standardName: '呋塞米片', genericName: '呋塞米', specification: '20mg×100片', manufacturer: '江苏亚邦', dosageForm: 'tablet', insuranceCategory: 'A', unit: '瓶', referencePrice: 9.0, pinyinInitial: 'fsm', searchCode: 'fusaimi|fsm' } }),
    prisma.drug.upsert({ where: { id: 32 }, update: {}, create: { standardName: '氯化钾缓释片', genericName: '氯化钾', specification: '0.5g×48片', manufacturer: '广州白云山', dosageForm: 'tablet', insuranceCategory: 'A', unit: '盒', referencePrice: 11.0, pinyinInitial: 'lhj', searchCode: 'lvhuajia|lhj' } }),
    prisma.drug.upsert({ where: { id: 33 }, update: {}, create: { standardName: '二甲双胍格列本脲片', genericName: '二甲双胍格列本脲', specification: '250mg/1.25mg×36片', manufacturer: '江苏豪森', dosageForm: 'tablet', insuranceCategory: 'B', unit: '盒', referencePrice: 35.0, pinyinInitial: 'ejgg', searchCode: 'erjiaguaguagelie|ejgg' } }),
    prisma.drug.upsert({ where: { id: 34 }, update: {}, create: { standardName: '甘精胰岛素注射液', genericName: '甘精胰岛素', specification: '100U/mL×3mL', manufacturer: '赛诺菲', dosageForm: 'injection', insuranceCategory: 'B', unit: '支', referencePrice: 185.0, pinyinInitial: 'gjyds', searchCode: 'ganjingyidaosu|gjyds' } }),
    prisma.drug.upsert({ where: { id: 35 }, update: {}, create: { standardName: '盐酸曲马多缓释片', genericName: '曲马多', specification: '100mg×10片', manufacturer: '格兰泰', dosageForm: 'tablet', insuranceCategory: 'C', unit: '盒', referencePrice: 38.0, pinyinInitial: 'ysqmd', searchCode: 'yansuanqumaduo|ysqmd' } }),
    prisma.drug.upsert({ where: { id: 36 }, update: {}, create: { standardName: '硫酸氢氯吡格雷片', genericName: '氢氯吡格雷', specification: '75mg×14片', manufacturer: '信立泰', dosageForm: 'tablet', insuranceCategory: 'B', unit: '盒', referencePrice: 68.0, pinyinInitial: 'lsql', searchCode: 'liusuanqinglvbigelie|lsql' } }),
    prisma.drug.upsert({ where: { id: 37 }, update: {}, create: { standardName: '银杏叶提取物片', genericName: '银杏叶提取物', specification: '40mg×20片', manufacturer: '威玛舒培', dosageForm: 'tablet', insuranceCategory: 'C', unit: '盒', referencePrice: 45.0, pinyinInitial: 'yxy', searchCode: 'yinxingyetiquwu|yxy' } }),
    prisma.drug.upsert({ where: { id: 38 }, update: {}, create: { standardName: '蒲地蓝消炎口服液', genericName: '蒲地蓝', specification: '10mL×10支', manufacturer: '济川药业', dosageForm: 'syrup', insuranceCategory: 'B', unit: '盒', referencePrice: 28.0, pinyinInitial: 'pdl', searchCode: 'pudilan|pdl' } }),
    prisma.drug.upsert({ where: { id: 39 }, update: {}, create: { standardName: '连花清瘟胶囊', genericName: '连花清瘟', specification: '0.35g×36粒', manufacturer: '以岭药业', dosageForm: 'capsule', insuranceCategory: 'B', unit: '盒', referencePrice: 22.0, pinyinInitial: 'lhqw', searchCode: 'lianhuaqingwen|lhqw' } }),
    prisma.drug.upsert({ where: { id: 40 }, update: {}, create: { standardName: '复方丹参滴丸', genericName: '复方丹参', specification: '27mg×180丸', manufacturer: '天士力', dosageForm: 'drop', insuranceCategory: 'A', unit: '瓶', referencePrice: 32.0, pinyinInitial: 'ffds', searchCode: 'fufangdanshen|ffds' } }),
    prisma.drug.upsert({ where: { id: 41 }, update: {}, create: { standardName: '速效救心丸', genericName: '速效救心', specification: '40mg×120丸', manufacturer: '天津中新', dosageForm: 'drop', insuranceCategory: 'A', unit: '盒', referencePrice: 25.0, pinyinInitial: 'sxjxw', searchCode: 'suxiaojiuxinwan|sxjxw' } }),
    prisma.drug.upsert({ where: { id: 42 }, update: {}, create: { standardName: '麝香保心丸', genericName: '麝香保心', specification: '22.5mg×42丸', manufacturer: '上海和黄', dosageForm: 'drop', insuranceCategory: 'A', unit: '盒', referencePrice: 36.0, pinyinInitial: 'sxbxw', searchCode: 'shexiangbaoxinwan|sxbxw' } }),
    prisma.drug.upsert({ where: { id: 43 }, update: {}, create: { standardName: '稳心颗粒', genericName: '稳心颗粒', specification: '5g×9袋', manufacturer: '步长制药', dosageForm: 'granule', insuranceCategory: 'B', unit: '盒', referencePrice: 29.0, pinyinInitial: 'wxkl', searchCode: 'wenxinkeli|wxkl' } }),
    prisma.drug.upsert({ where: { id: 44 }, update: {}, create: { standardName: '参松养心胶囊', genericName: '参松养心', specification: '0.4g×36粒', manufacturer: '以岭药业', dosageForm: 'capsule', insuranceCategory: 'B', unit: '盒', referencePrice: 38.0, pinyinInitial: 'ssyx', searchCode: 'sensongyangxin|ssyx' } }),
    prisma.drug.upsert({ where: { id: 45 }, update: {}, create: { standardName: '消渴丸', genericName: '消渴丸', specification: '52.5g/瓶', manufacturer: '广州白云山', dosageForm: 'drop', insuranceCategory: 'A', unit: '瓶', referencePrice: 24.0, pinyinInitial: 'xkw', searchCode: 'xiaokewan|xkw' } }),
    prisma.drug.upsert({ where: { id: 46 }, update: {}, create: { standardName: '玉屏风颗粒', genericName: '玉屏风', specification: '5g×10袋', manufacturer: '广东环球', dosageForm: 'granule', insuranceCategory: 'C', unit: '盒', referencePrice: 26.0, pinyinInitial: 'ypfkl', searchCode: 'yupingfengkeli|ypfkl' } }),
    prisma.drug.upsert({ where: { id: 47 }, update: {}, create: { standardName: '双歧杆菌三联活菌胶囊', genericName: '双歧杆菌三联活菌', specification: '210mg×36粒', manufacturer: '上海信谊', dosageForm: 'capsule', insuranceCategory: 'B', unit: '盒', referencePrice: 48.0, pinyinInitial: 'sqgj', searchCode: 'shuangqiganjunsanlianhuojun|sqgj' } }),
    prisma.drug.upsert({ where: { id: 48 }, update: {}, create: { standardName: '莫匹罗星软膏', genericName: '莫匹罗星', specification: '5g:0.1g/支', manufacturer: '中美史克', dosageForm: 'ointment', insuranceCategory: 'B', unit: '支', referencePrice: 16.0, pinyinInitial: 'mplx', searchCode: 'mopiluoxing|mplx' } }),
    prisma.drug.upsert({ where: { id: 49 }, update: {}, create: { standardName: '红霉素眼膏', genericName: '红霉素', specification: '2.5g/支', manufacturer: '广州白云山', dosageForm: 'ointment', insuranceCategory: 'A', unit: '支', referencePrice: 3.5, pinyinInitial: 'hmsyg', searchCode: 'hongmeisuyangao|hmsyg' } }),
    prisma.drug.upsert({ where: { id: 50 }, update: {}, create: { standardName: '硝酸甘油片', genericName: '硝酸甘油', specification: '0.5mg×100片', manufacturer: '山东信谊', dosageForm: 'tablet', insuranceCategory: 'A', unit: '瓶', referencePrice: 15.0, pinyinInitial: 'xsgy', searchCode: 'xiaosuanganyou|xsgy' } }),
  ])

  // ---- Drug-Ingredient associations ----
  const allergenPenicillin = allergens[0]
  const allergenCephalosporin = allergens[1]
  const allergenSulfa = allergens[2]
  const allergenAspirin = allergens[3]
  const allergenIbuprofen = allergens[4]
  const allergenAcetaminophen = allergens[5]
  const allergenStreptomycin = allergens[6]
  const allergenInsulin = allergens[7]

  const drugIngredientData = [
    { drugId: 5, allergenId: allergenPenicillin.id, amount: '0.5g' },       // 阿莫西林 → 青霉素
    { drugId: 8, allergenId: allergenCephalosporin.id, amount: '0.25g' },    // 头孢拉定 → 头孢菌素
    { drugId: 24, allergenId: allergenPenicillin.id, amount: '80万单位' },    // 注射用青霉素钠 → 青霉素
    { drugId: 25, allergenId: allergenCephalosporin.id, amount: '125mg' },   // 头孢克洛 → 头孢菌素
    { drugId: 21, allergenId: allergenStreptomycin.id, amount: '0.5g' },     // 左氧氟沙星 → 链霉素 (氨基糖苷类交叉)
    { drugId: 6, allergenId: allergenIbuprofen.id, amount: '0.3g' },         // 布洛芬 → 布洛芬
    { drugId: 34, allergenId: allergenInsulin.id, amount: '100U/mL' },       // 甘精胰岛素 → 胰岛素
  ]
  for (const di of drugIngredientData) {
    await prisma.drugIngredient.upsert({
      where: { drugId_allergenId: { drugId: di.drugId, allergenId: di.allergenId } },
      update: {},
      create: { drugId: di.drugId, allergenId: di.allergenId, amount: di.amount },
    })
  }

  // ---- Drug Interactions (clinically meaningful pairs) ----
  const interactionData = [
    { drugAId: 28, drugBId: 5, severity: 'severe', description: '华法林与阿莫西林联用增强抗凝作用，出血风险显著增加，需监测INR' },
    { drugAId: 28, drugBId: 6, severity: 'severe', description: '华法林与布洛芬联用增加消化道出血风险，且NSAIDs抑制血小板功能' },
    { drugAId: 28, drugBId: 4, severity: 'moderate', description: '华法林与二甲双胍联用需监测血糖，二甲双胍可能增强抗凝效果' },
    { drugAId: 2, drugBId: 32, severity: 'moderate', description: '厄贝沙坦与氯化钾联用增加高钾血症风险，需监测血钾水平' },
    { drugAId: 2, drugBId: 30, severity: 'moderate', description: '厄贝沙坦与螺内酯联用增加高钾血症风险，避免常规联用' },
    { drugAId: 3, drugBId: 13, severity: 'moderate', description: '阿托伐他汀与瑞舒伐他汀同为他汀类药物，联用增加肌病和肝损风险' },
    { drugAId: 3, drugBId: 28, severity: 'moderate', description: '阿托伐他汀与华法林联用可能增强抗凝作用，需监测INR' },
    { drugAId: 15, drugBId: 1, severity: 'moderate', description: '氨氯地平与硝苯地平同为钙通道阻滞剂，联用降压效果过强' },
    { drugAId: 10, drugBId: 4, severity: 'moderate', description: '阿卡波糖与二甲双胍联用降糖效果叠加，注意低血糖风险' },
    { drugAId: 5, drugBId: 8, severity: 'moderate', description: '阿莫西林与头孢拉定联用可能存在交叉过敏，青霉素过敏者慎用头孢' },
    { drugAId: 17, drugBId: 27, severity: 'moderate', description: '奥美拉唑降低氯吡格雷抗血小板活性，增加心血管事件风险' },
  ]

  for (const ix of interactionData) {
    await prisma.drugInteraction.upsert({
      where: { drugAId_drugBId: { drugAId: ix.drugAId, drugBId: ix.drugBId } },
      update: {},
      create: { drugAId: ix.drugAId, drugBId: ix.drugBId, severity: ix.severity, description: ix.description },
    })
  }

  // ---- Drug Batches (inventory) ----
  const batchData = [
    { drugId: 1, batchNo: 'B20260601001', quantity: 200, unitPrice: 25.0, expireDate: new Date('2027-06-01') },
    { drugId: 2, batchNo: 'B20260515001', quantity: 150, unitPrice: 20.0, expireDate: new Date('2027-05-15') },
    { drugId: 3, batchNo: 'B20260603001', quantity: 180, unitPrice: 35.0, expireDate: new Date('2027-06-03') },
    { drugId: 4, batchNo: 'B20260520001', quantity: 300, unitPrice: 8.0, expireDate: new Date('2027-05-20') },
    { drugId: 5, batchNo: 'B20260601002', quantity: 250, unitPrice: 10.0, expireDate: new Date('2027-06-01') },
    { drugId: 6, batchNo: 'B20260510001', quantity: 120, unitPrice: 14.0, expireDate: new Date('2027-05-10') },
    { drugId: 7, batchNo: 'B20260401001', quantity: 80, unitPrice: 5.5, expireDate: new Date('2026-10-01') },   // 低库存
    { drugId: 8, batchNo: 'B20260603002', quantity: 200, unitPrice: 16.0, expireDate: new Date('2027-06-03') },
    { drugId: 9, batchNo: 'B20260525001', quantity: 90, unitPrice: 28.0, expireDate: new Date('2027-05-25') },
    { drugId: 10, batchNo: 'B20260602001', quantity: 160, unitPrice: 42.0, expireDate: new Date('2027-06-02') },
    { drugId: 5, batchNo: 'B20260415001', quantity: 5, unitPrice: 9.5, expireDate: new Date('2026-08-15') },     // 即将过期
    { drugId: 20, batchNo: 'B20260528001', quantity: 100, unitPrice: 12.0, expireDate: new Date('2027-05-28') },
    // Low-stock batches for pharmacy alerts
    { drugId: 3, batchNo: 'B20260120001', quantity: 3, unitPrice: 33.0, expireDate: new Date('2026-07-15') },     // 低库存 + 即将过期
    { drugId: 2, batchNo: 'B20260301001', quantity: 8, unitPrice: 19.5, expireDate: new Date('2026-12-01') },     // 低库存
    { drugId: 7, batchNo: 'B20260220001', quantity: 6, unitPrice: 5.0, expireDate: new Date('2026-09-20') },      // 低库存
  ]
  for (const b of batchData) {
    await prisma.drugBatch.upsert({
      where: { drugId_batchNo: { drugId: b.drugId, batchNo: b.batchNo } },
      update: {},
      create: { drugId: b.drugId, batchNo: b.batchNo, quantity: b.quantity, unitPrice: b.unitPrice, expireDate: b.expireDate },
    })
  }

  // ---- Patient-Allergen associations ----
  await prisma.patientAllergy.upsert({
    where: { patientId_allergenId: { patientId: 1, allergenId: allergenPenicillin.id } },
    update: {},
    create: { patientId: 1, allergenId: allergenPenicillin.id, severity: 'severe', remark: '曾出现过敏性休克', source: 'migration' },
  })
  await prisma.patientAllergy.upsert({
    where: { patientId_allergenId: { patientId: 2, allergenId: allergenCephalosporin.id } },
    update: {},
    create: { patientId: 2, allergenId: allergenCephalosporin.id, severity: 'moderate', remark: '服用后全身皮疹', source: 'migration' },
  })

  // 1. Pending (waiting for doctor review)
  const now = new Date()
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  await prisma.prescription.upsert({
    where: { id: 1 },
    update: {},
    create: {
      prescriptionNo: 'PRS-20260603-000001',
      patientId: patient1.id,
      assistantId: assistant.id,
      diagnosis: '高血压病 2 级，规律服药，血压控制可',
      status: 'pending',
      submittedAt: oneHourAgo,
      items: {
        create: [
          { drugName: '硝苯地平控释片', specification: '30mg x 7片', dosage: '1片', frequency: 'qd', days: 7 },
          { drugName: '厄贝沙坦片', specification: '150mg x 7片', dosage: '1片', frequency: 'qd', days: 7 },
        ],
      },
      timeline: {
        create: [
          { action: 'created', operatorId: assistant.id, operatorName: '李助理', detail: '创建处方' },
          { action: 'submitted', operatorId: assistant.id, operatorName: '李助理', detail: '提交审核' },
        ],
      },
    },
  })

  // 2. Draft (not yet submitted)
  await prisma.prescription.upsert({
    where: { id: 2 },
    update: {},
    create: {
      prescriptionNo: 'PRS-20260603-000002',
      patientId: patient2.id,
      assistantId: assistant.id,
      diagnosis: '糖尿病 2 型，空腹血糖 7.2mmol/L，建议控制饮食',
      status: 'draft',
      items: {
        create: [
          { drugName: '盐酸二甲双胍片', specification: '0.5g x 20片', dosage: '1片', frequency: 'bid', days: 10 },
        ],
      },
      timeline: {
        create: [
          { action: 'created', operatorId: assistant.id, operatorName: '李助理', detail: '创建处方草稿' },
        ],
      },
    },
  })

  // 3. Approved (ready for courier pickup)
  await prisma.prescription.upsert({
    where: { id: 3 },
    update: {},
    create: {
      prescriptionNo: 'PRS-20260603-000003',
      patientId: patient1.id,
      assistantId: assistant.id,
      doctorId: doctor.id,
      diagnosis: '高血脂症，总胆固醇 6.2mmol/L',
      status: 'approved',
      submittedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      approvedAt: new Date(now.getTime() - 30 * 60 * 1000),
      items: {
        create: [
          { drugName: '阿托伐他汀钙片', specification: '20mg x 7片', dosage: '1片', frequency: 'qn', days: 7 },
        ],
      },
      timeline: {
        create: [
          { action: 'created', operatorId: assistant.id, operatorName: '李助理', detail: '创建处方' },
          { action: 'submitted', operatorId: assistant.id, operatorName: '李助理', detail: '提交审核' },
          { action: 'approved', operatorId: doctor.id, operatorName: '张医生', detail: '审核通过' },
        ],
      },
    },
  })

  // 4. Rejected (with reason)
  await prisma.prescription.upsert({
    where: { id: 4 },
    update: {},
    create: {
      prescriptionNo: 'PRS-20260603-000004',
      patientId: patient2.id,
      assistantId: assistant.id,
      doctorId: doctor.id,
      diagnosis: '感冒，咳嗽，发热 38.5°C',
      status: 'rejected',
      rejectedReason: '诊断描述不够详细，请补充体温持续时间和伴随症状，并说明是否有药物过敏史',
      rejectedType: 'normal',
      rejectedById: doctor.id,
      submittedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      rejectedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      items: {
        create: [
          { drugName: '布洛芬缓释胶囊', specification: '0.3g x 20粒', dosage: '1粒', frequency: 'bid', days: 3 },
        ],
      },
      timeline: {
        create: [
          { action: 'created', operatorId: assistant.id, operatorName: '李助理', detail: '创建处方' },
          { action: 'submitted', operatorId: assistant.id, operatorName: '李助理', detail: '提交审核' },
          { action: 'rejected', operatorId: doctor.id, operatorName: '张医生', detail: '诊断描述不够详细，请补充体温持续时间和伴随症状，并说明是否有药物过敏史', metadata: JSON.stringify({ type: 'normal' }) },
        ],
      },
    },
  })

  // 5. Delivering
  await prisma.prescription.upsert({
    where: { id: 5 },
    update: {},
    create: {
      prescriptionNo: 'PRS-20260603-000005',
      patientId: patient1.id,
      assistantId: assistant.id,
      doctorId: doctor.id,
      courierId: courier.id,
      diagnosis: '急性咽炎，咽部充血',
      status: 'delivering',
      trackingNo: 'SF1234567890',
      submittedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      approvedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      pickedUpAt: new Date(now.getTime() - 60 * 60 * 1000),
      estimatedDelivery: new Date(now.getTime() + 60 * 60 * 1000),
      items: {
        create: [
          { drugName: '阿莫西林胶囊', specification: '0.5g x 24粒', dosage: '1粒', frequency: 'tid', days: 3 },
          { drugName: '复方甘草片', specification: '100片/瓶', dosage: '3片', frequency: 'tid', days: 3 },
        ],
      },
      timeline: {
        create: [
          { action: 'created', operatorId: assistant.id, operatorName: '李助理', detail: '创建处方' },
          { action: 'submitted', operatorId: assistant.id, operatorName: '李助理', detail: '提交审核' },
          { action: 'approved', operatorId: doctor.id, operatorName: '张医生', detail: '审核通过' },
          { action: 'picked_up', operatorId: courier.id, operatorName: '王师傅', detail: '快递员取件' },
        ],
      },
    },
  })

  // 6. Approved (ready for pharmacy dispensing — patient1 with penicillin allergy + 阿莫西林 for allergy testing)
  const ninetyMinAgo = new Date(now.getTime() - 90 * 60 * 1000)
  await prisma.prescription.upsert({
    where: { id: 6 },
    update: {},
    create: {
      prescriptionNo: 'PRS-20260604-000006',
      patientId: patient1.id,
      assistantId: assistant.id,
      doctorId: doctor.id,
      diagnosis: '急性扁桃体炎，咽痛伴发热 38.2°C',
      status: 'approved',
      submittedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      approvedAt: ninetyMinAgo,
      items: {
        create: [
          { drugId: 5, drugName: '阿莫西林胶囊', specification: '0.5g×24粒', dosage: '1粒', frequency: 'tid', days: 5 },
          { drugId: 7, drugName: '复方甘草片', specification: '100片/瓶', dosage: '3片', frequency: 'tid', days: 3 },
        ],
      },
      timeline: {
        create: [
          { action: 'created', operatorId: assistant.id, operatorName: '李助理', detail: '创建处方' },
          { action: 'submitted', operatorId: assistant.id, operatorName: '李助理', detail: '提交审核' },
          { action: 'approved', operatorId: doctor.id, operatorName: '张医生', detail: '审核通过，交药房配药' },
        ],
      },
    },
  })

  // ---- Rejection Templates ----
  await prisma.rejectionTemplate.upsert({
    where: { id: 1 },
    update: {},
    create: { doctorId: doctor.id, name: '剂量错误', content: '药品剂量超出常规范围，请核对后修正。' },
  })
  await prisma.rejectionTemplate.upsert({
    where: { id: 2 },
    update: {},
    create: { doctorId: doctor.id, name: '诊断与用药不符', content: '诊断描述与所开药品的适应症不匹配，请核实。' },
  })
  await prisma.rejectionTemplate.upsert({
    where: { id: 3 },
    update: {},
    create: { doctorId: doctor.id, name: '药物禁忌', content: '患者存在相关药物禁忌或过敏史，请更换药品。' },
  })
  await prisma.rejectionTemplate.upsert({
    where: { id: 4 },
    update: {},
    create: { doctorId: doctor.id, name: '缺少检查结果', content: '缺少必要的检查结果支持诊断，请补充相关检查报告。' },
  })
  await prisma.rejectionTemplate.upsert({
    where: { id: 5 },
    update: {},
    create: { doctorId: doctor.id, name: '患者信息不全', content: '患者基本信息或过敏史不完整，请完善后重新提交。' },
  })

  // ---- Notifications ----
  await prisma.notification.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: doctor.id,
      type: 'review',
      title: '新处方待审核',
      content: '李助理提交了赵建国的处方（高血压病），请尽快审核。',
      prescriptionId: 1,
    },
  })
  await prisma.notification.upsert({
    where: { id: 2 },
    update: {},
    create: {
      userId: assistant.id,
      type: 'rejected',
      title: '处方被驳回',
      content: '张医生驳回了李奶奶的处方（感冒），请查看驳回理由并修改。',
      prescriptionId: 4,
    },
  })
  await prisma.notification.upsert({
    where: { id: 3 },
    update: {},
    create: {
      userId: courier.id,
      type: 'delivery',
      title: '新待取件处方',
      content: '有新的已通过处方待取件配送。',
      prescriptionId: 3,
    },
  })

  console.log('Seed complete. Login accounts (password: 123456):')
  console.log('  assistant:  13800001111')
  console.log('  doctor:     13800002222')
  console.log('  courier:    13800003333')
  console.log('  patient:    13800004444')
  console.log('  pharmacist: 13800005555 (门诊药房)')
  console.log('  pharmacist: 13800006666 (住院药房)')
  console.log('')
  console.log('Drug catalog: 50 drugs, 10 allergens, 7 ingredient links, 12 drug interactions, 15 batches')
  console.log('Patient allergies: 2 (patient #1 penicillin severe, patient #2 cephalosporin moderate)')
  console.log('')
  console.log('Prescriptions:')
  console.log('  #1 pending    - 高血压病 (赵建国)')
  console.log('  #2 draft      - 糖尿病 (李奶奶)')
  console.log('  #3 approved   - 高血脂症 (赵建国)')
  console.log('  #4 rejected   - 感冒 (李奶奶)')
  console.log('  #5 delivering - 急性咽炎 (赵建国)')
  console.log('  #6 approved   - 急性扁桃体炎 (赵建国) [queue test: 青霉素过敏 + 阿莫西林]')
  console.log('')
  console.log('Rejection templates: 5')
  console.log('Notifications: 3')
}

main().catch(console.error).finally(() => prisma.$disconnect())
