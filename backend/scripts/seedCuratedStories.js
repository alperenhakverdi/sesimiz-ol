#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const curatedStories = [
  {
    title: 'İş Yerinde Mobbing ve Yalnızlık',
    content:
      'Üç yıldır çalıştığım şirkette erkek meslektaşlarım sunumlarımı sürekli bölüyor, fikirlerimi kendi fikirleriymiş gibi paylaşıyor. Yöneticiye söylediğimde “takma kafana, onlar öyledir” demekle yetindi. Zamanla görünmez oldum. Kaygı atakları yaşamaya başladım; ama bugün İK’ya resmi kayıt açtım. Korkuyorum ama vazgeçmeyeceğim.'
  },
  {
    title: 'Ekonomik Şiddet: Maaş Kartım Eşimde',
    content:
      'Çalışıyorum ama maaş kartım eşimde. Harcamalarımı tek tek sorguluyor, “evin kadını para biriktirir” diyor. Bir terapistle görüştüm ve ekonomik şiddet olduğunu öğrendim. Gizlice kendi hesabımı açtım. Bu ay maaşım ilk kez bana yattı. Küçük bir adım ama özgürlüğüm için büyük.'
  },
  {
    title: 'Eski Sevgilimin Israrlı Takibi',
    content:
      'Ayrıldığımızdan beri iş çıkışında bekliyor, sosyal medya hesaplarıma sahte profillerden mesaj atıyor. Polis “somut zarar yok” dedi. Kadın danışma merkezine ulaştım, hukuki destek alıyorum. Çevrem “büyütme” dedi ama bu korku gerçek. Yalnız olmadığımı bilmek iyi geliyor.'
  },
  {
    title: 'Aile Baskısı ve Zorla Evlendirme Tehdidi',
    content:
      'Ailem sürekli “yaşın geçti” diye evlenmem için baskı yapıyor. Reddettiğimde konuşmuyorlar. Bir keresinde istemediğim biriyle görüştürmek için ısrar ettiler. Şu an arkadaşımda kalıyorum. Üniversitedeki danışman hocamla plan yapıyoruz. Hayatımı kendim kuracağım.'
  },
  {
    title: 'Toplu Taşımada Cinsel Taciz',
    content:
      'Otobüste yan koltuğa oturan adam vücudunu bana yasladı. Kıpırdayamadım, sesim çıkmadı. Bunun benim suçum olmadığını biliyorum. Bir sonraki durakta inip şoföre anlattım, kamera kayıtları istendi. O günden beri kulaklıkla yüksek müzik dinlemiyorum; çevreyi daha çok takip ediyorum.'
  },
  {
    title: 'Üniversitede Hocanın Sınır İhlali',
    content:
      'Danışman hocam randevu saatlerini sürekli akşam geç saatlere koyuyor, özel sorular soruyordu. Bölüm başkanına gidip resmi dilekçe verdim. İlk başta “abartma” dendi ama vazgeçmedim. Başka öğrencilerin de şikâyeti varmış. Soruşturma açıldı.'
  },
  {
    title: 'Boşanma Sürecinde Tehdit ve Korku',
    content:
      'Boşanmak istiyorum, “çocuğu göstermezsin” diye tehdit ediyor. Avukatım uzaklaştırma kararı çıkardı. Korkuyorum ama çocuğumla iyi bir hayat kuracağım. Destek hattına bağlandım, yalnız olmadığımı bilmek güç veriyor.'
  },
  {
    title: 'Tek Başına Annelik ve İş Bulma Çabası',
    content:
      'Oğlum iki yaşında. Gündüz iş arıyor, akşam uyuyunca CV güncelliyorum. Görüşmelerde “küçük çocuğun var, devamlılık?” diye soruyorlar. Açıkça söylemeseler de anneliğim engel oluyor. Umudumu kaybetmeyeceğim; uzaktan çalışabileceğim işlere yöneldim.'
  },
  {
    title: 'Göçmen Kadın Olarak İşte Sömürü',
    content:
      'Dil bilmediğim için düşük ücretle, sigortasız çalıştırdılar. “İdare et” dediler. Bir derneğe ulaştım; hukuki danışmanlık aldım. Şimdi sözleşme yapmadan başlamıyorum. Kendi değerimi hatırlamak için çok çaba gerekti ama değiyor.'
  },
  {
    title: 'Bakım Yükü: Yaşlı Kayınvalide ve İş Hayatı',
    content:
      'Eve destek olmama rağmen eşimin ailesi “sen kadındın, bakarsın” diyor. Gece gündüz koşturuyorum. Aile içi iş bölümü üzerine konuştuk, haftalık program yaptık. İlk başta zor oldu ama sorumluluk paylaşımı başladı.'
  },
  {
    title: 'Dijital Şiddet: Konum Paylaşımı Zorlaması',
    content:
      'Partnerim sürekli konumumu kontrol ediyor, geç cevap verince öfkeleniyor. Bunu “sevgi” diye meşrulaştırıyordu. Telefonuma şifre koydum, konum paylaşımını kapattım. Güvendiğim bir arkadaşıma yaşadıklarımı anlattım. Sınırlarımı korumayı öğreniyorum.'
  },
  {
    title: 'Hamilelikte İşten Çıkarma Tehdidi',
    content:
      'Hamile olduğumu söyledikten sonra “projeler aksar” diyerek mobbing başladı. İşten ayrılmam için baskı yaptılar. Belgeleri topladım, hukuki süreç başlattım. Şu an daha güvende hissediyorum. Haklarımı öğrenmek bana cesaret verdi.'
  },
  {
    title: 'Sokakta Sözlü Taciz ve Yalnızlık Hissi',
    content:
      'Eve yürürken iki kişi arkamdan laf attı, peşimden geldiler. O gece yalnız uyuyamadım. Sonra mahallenin kadınlarıyla bir grup kurduk. Birbirimizi görünce selamlaşıyoruz. Bu küçük dayanışma güven veriyor.'
  },
  {
    title: 'Sağlık Ocağında Ayrımcılık',
    content:
      'Hamilelik kontrolünde hemşire azarladı; randevu sistemini yanlış anlamışım. “Anne olacaksın, dikkat et” dedi. Beni utandırdı. Şikâyet ettim. Daha saygılı iletişim beklemek hakkımız.'
  },
  {
    title: 'LGBTİ+ Kadın Olarak Aile Baskısı',
    content:
      'Kendimi açıkladığımdan beri evde huzur yok. “Geçer” diyorlar, “utanıyoruz” diyorlar. Bir destek grubuyla tanıştım. Terapide “suçluluk” benim yüküm değilmiş, öğrendim. Kendim olarak var olmak en doğal hakkım.'
  },
  {
    title: 'Kadın Sığınma Evi Deneyimi ve Yeniden Başlamak',
    content:
      'Şiddetten kaçıp sığınma evine yerleştirildim. İlk günler çok zor geçti; sonra nefes almaya başladım. Yeni bir şehirde küçük bir ev tuttum. Hayatıma sıfırdan başlıyorum. Korkularım var ama özgürüm.'
  },
  {
    title: 'Polise Başvurma Korkusu ve Cesaret',
    content:
      'Defalarca “ya inanmazlarsa” diye düşündüm. Sonunda karakola gittim. Tutanak tutuldu. Hukuki sürecin uzun olacağını söylediler; pes etmeyeceğim. Bu cümleyi yazmak bile hafifletiyor.'
  },
  {
    title: 'Erken Yaşta Evliliğe Karşı Mücadele',
    content:
      'Küçükken kuzenimin zorla nişanlandırılmasına tanık oldum. Yıllar sonra gönüllü olduğum dernekle kırsalda seminerler veriyoruz. Bilgilendirme hayat kurtarıyor. Kendi hikâyemi anlatmak istedim; susmak istemiyorum.'
  },
  {
    title: 'İş Yerinde Kıyafet Baskısı',
    content:
      '“Müşteri karşısında topuklu giy” baskısı bitmiyor. Rahat ayakkabı giyince performansımın düştüğünü iddia ettiler. İK ile görüştüm; kıyafet kurallarının insan onuruna yakışır şekilde güncellenmesi için talep açıldı.'
  },
  {
    title: 'Siber Zorbalık ve Kendini Koruma Yolları',
    content:
      'İş yerinde hakkımı arayınca sahte hesaplardan hakaret yağdı. Ekran görüntülerini aldım; BT ile görüştüm, IP kayıtları inceleniyor. Psikolojik destek alıyorum. Güçlü kalmaya çalışıyorum.'
  }
];

const supportiveComments = [
  'Yalnız değilsin, yanındayız. Cesaretin ilham veriyor.',
  'Hakkını aramak zor ama çok değerli. Güçlüsün.',
  'Paylaşımın için teşekkürler. Dayanışma ile güçleniyoruz.',
  'Yaşadıkların senin suçun değil. İyi ki yazdın.',
  'Umarım süreç istediğin gibi sonuçlanır. Destek olmak isteriz.'
];

async function pickAuthors(limit = 10) {
  const users = await prisma.user.findMany({
    where: { isActive: true, isBanned: false, role: 'USER' },
    select: { id: true, nickname: true },
    take: limit
  });
  if (users.length === 0) {
    throw new Error('USER rolünde yazar bulunamadı. Önce seed:extra çalıştırın.');
  }
  return users;
}

async function main() {
  // Wipe existing stories and comments
  await prisma.comment.deleteMany({});
  await prisma.story.deleteMany({});

  const authors = await pickAuthors(12);

  let createdStories = 0;
  let createdComments = 0;

  for (let i = 0; i < curatedStories.length; i++) {
    const author = authors[i % authors.length];
    const data = curatedStories[i];

    const story = await prisma.story.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: author.id
      }
    });
    createdStories++;

    // add 2-3 supportive comments by other users
    const commenters = authors.filter(u => u.id !== author.id);
    const commentersForStory = [commenters[(i + 1) % commenters.length], commenters[(i + 3) % commenters.length]];
    for (const commenter of commentersForStory) {
      const text = supportiveComments[(i + commenter.id) % supportiveComments.length];
      await prisma.comment.create({
        data: {
          storyId: story.id,
          authorId: commenter.id,
          content: text
        }
      });
      createdComments++;
    }
  }

  console.log(`Created ${createdStories} curated stories and ${createdComments} comments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

