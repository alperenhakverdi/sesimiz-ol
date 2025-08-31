import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const users = [
  { nickname: "AyşeninSesi", avatar: "https://i.pravatar.cc/150?u=1" },
  { nickname: "GüvenliLiman", avatar: "https://i.pravatar.cc/150?u=2" },
  { nickname: "UmutluKalbim", avatar: "https://i.pravatar.cc/150?u=3" },
  { nickname: "GüçlüKadın", avatar: "https://i.pravatar.cc/150?u=4" },
  { nickname: "YalnızKuş", avatar: "https://i.pravatar.cc/150?u=5" },
  { nickname: "SessizÇığlık", avatar: "https://i.pravatar.cc/150?u=6" },
  { nickname: "DirençliRuh", avatar: "https://i.pravatar.cc/150?u=7" },
  { nickname: "KırılganAma", avatar: "https://i.pravatar.cc/150?u=8" },
  { nickname: "YeniBaşlangıç", avatar: "https://i.pravatar.cc/150?u=9" },
  { nickname: "SabrıTükendi", avatar: "https://i.pravatar.cc/150?u=10" }
]

const stories = [
  {
    title: "İş Yerinde Yaşadığım Mobbing",
    content: "3 yıldır çalıştığım şirkette erkek meslektaşlarım sürekli fikirlerimi görmezden geliyor. Toplantılarda konuştuğumda 'kızlar işinden anlamaz' gibi yorumlar yapıyorlar. Patronum da erkek olduğu için onların tarafını tutuyor. Özgüvenim çok sarsıldı ama bırakmamaya kararlıyım. Bu durumu nasıl aşabilirim bilmiyorum.",
    authorIndex: 0
  },
  {
    title: "Annemle Aramızdaki Sorunlar",
    content: "Annem sürekli evlenme konusunda baskı yapıyor. 'Yaşın geçiyor, kimse seni almaz' diyor. 30 yaşındayım ve kariyerime odaklanmak istiyorum ama ailem bunu anlayamıyor. Her aile toplantısı büyük bir işkenceye dönüşüyor. Kendi kararlarımı veremiyorum gibi hissediyorum.",
    authorIndex: 1
  },
  {
    title: "Tek Başıma Anne Olmak",
    content: "Bebeğimin babası hamilelik öğrenince ortadan kayboldu. Şimdi 2 yaşındaki oğlumla tek başımayım. Mali durumum zor, ailem destek olmuyor 'neden evlenmedin önce' diyorlar. Çok yoruldum ama oğlum için güçlü olmaya çalışıyorum. Bazen ne kadar dayanabilirim bilmiyorum.",
    authorIndex: 2
  },
  {
    title: "Üniversitede Taciz Yaşadım",
    content: "Hocam sürekli kişisel sorular soruyor, derse kalmam için bahaneler üreterek yanımda durmaya çalışıyor. Şikayet etmek istiyorum ama kanıtım yok. Ailem 'sen yanlış anlamışsındır' diyor. Okulu bırakmayı düşünüyorum ama hayallerimi de bırakmak istemiyorum.",
    authorIndex: 3
  },
  {
    title: "Kocamın Ailesi Beni Kabul Etmiyor",
    content: "2 yıldır evliyim ama kayınvalidem hiçbir şeyimi beğenmiyor. Yemek yapışımdan temizliğime kadar her şeye karışıyor. Eşim araya girmiyor, 'annem haklı' diyor. Evimde yabancı gibi hissediyorum. Kendi ailemi özlüyorum ama onlar da 'sabret, zamanla geçer' diyor.",
    authorIndex: 4
  },
  {
    title: "Doğum Sonrası Depresyonum",
    content: "Bebeğimi doğurduktan sonra çok mutlu olacağımı düşünüyordum ama sürekli ağlama krizleri geçiriyorum. Bebeğime bakamayacağımı düşünüyorum. Çevremdekiler 'bu doğal' diyor ama ben normal hissetmiyorum. Yardım istiyorum ama kimse ciddiye almıyor.",
    authorIndex: 5
  },
  {
    title: "Abim Beni Sürekli Dövüyor",
    content: "19 yaşındayım ama abim hala beni küçük çocuk gibi görüyor. Geç geldiğimde ya da erkek arkadaşlarımla konuştuğumda beni dövüyor. Babam 'erkek kardeş böyle korur' diyor. Evden kaçmayı düşünüyorum ama nereye gideceğimi bilmiyorum.",
    authorIndex: 6
  },
  {
    title: "İş Bulamıyorum Çünkü Kadınım",
    content: "Mühendislik mezunuyum ama 6 aydır işsizim. Mülakatların çoğunda 'evlenince çalışmaya devam eder misin' sorusu geliyor. Biri açıkça 'erkek mühendis tercih ediyoruz' dedi. Ailem 'zor alan seçtin' diyor. Hayallerimi gerçekleştirmek bu kadar zor olacağını bilmiyordum.",
    authorIndex: 7
  },
  {
    title: "Eski Sevgilim Beni Stalklıyor",
    content: "Ayrıldığımız halde eski sevgilim peşimi bırakmıyor. İş yerimin önünde bekliyor, telefonumu arıyor, sosyal medyada takip ediyor. Aileme söylediğimde 'ona da acı' dediler. Polis 'somut bir zarar vermedikçe yapacak bir şey yok' diyor. Çok korkuyorum.",
    authorIndex: 8
  },
  {
    title: "Hamile Kaldığım İçin İşten Çıkarıldım",
    content: "Hamile olduğumu patron öğrenince 'şirkete yük olacaksın' deyip işten çıkardı. Hukuken haksız olduğunu biliyorum ama davaya gücüm yetmiyor. Eşim 'bir yerden başka iş bulursun' diyor ama kimse hamile birini işe almak istemiyor. Bebeğim doğana kadar nasıl geçineceğiz bilmiyorum.",
    authorIndex: 9
  }
]

async function main() {
  // Önce tüm verileri temizle
  await prisma.story.deleteMany({})
  await prisma.user.deleteMany({})
  
  console.log('🗑️  Eski veriler temizlendi')
  
  // Kullanıcıları oluştur
  const createdUsers = []
  for (let i = 0; i < users.length; i++) {
    const user = await prisma.user.create({
      data: users[i]
    })
    createdUsers.push(user)
  }
  
  console.log('👥 10 kullanıcı oluşturuldu')
  
  // Hikayeleri oluştur
  for (let i = 0; i < stories.length; i++) {
    const story = stories[i]
    await prisma.story.create({
      data: {
        title: story.title,
        content: story.content,
        authorId: createdUsers[story.authorIndex].id
      }
    })
  }
  
  console.log('📚 10 hikaye oluşturuldu')
  console.log('✅ Veritabanı başarıyla dolduruldu!')
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })