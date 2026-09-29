=== route_cross ===
>>> chapter "The Cross" "Chapter 7 · The Little Relief, early July"
>>> stage p2-st-angelo
>>> actor valette 4 2 south
>>> actor ninu 4 4 north
LA VALETTE: Fra Luis de Arrieta told you. Before the end.
NINU: He did, Eminence.
LA VALETTE: Then you know I have no right to call you anything but soldier. I took vows. I broke one, once, in a place where vows meant little, and I have kept the rest ever since.
* [Tell him you understand]
    ~ aff_valette += 1
    NINU: I didn't come for a name. I came to fight for Birgu, and to get my father back. Pawlu is my father.
    LA VALETTE: Yes. He is. And a better one than I could have been.
* [Tell him he should have told you]
    NINU: Twenty-three years, and you never once came to Żejtun.
    LA VALETTE: I came, twice. I stood at the edge of the fields and watched a boy mending nets. Then I went home and said nothing. You may judge me. God certainly will.
- LA VALETTE: Tonight a relief force from Sicily lands at Pietra Negra, six hundred men who will try to reach us by the Kalkara shore. The Turk is watching that shore. Bring them in.
>>> prep
>>> battle a1-piccolo-soccorso
-> senglea

= senglea
>>> chapter "Chapter 8" "The Palisade · 15 July"
>>> stage p1-workshop
>>> actor ninu 4 5 north
>>> actor kateri 5 4 west
>>> actor balbi 3 4 east
The Turk has dragged boats overland from Marsamxett into the Grand Harbour. At dawn they will storm Senglea from the water.
KATERI: The Grand Master had a palisade of stakes driven into the harbour floor. Maltese swimmers fought off the Turks trying to cut it, with knives in their teeth. Can you believe that?
BALBI: I can. I wrote it down this morning.
NINU: Then we hold the stakes.
>>> prep
>>> battle a2-senglea-palisade
-> castile

= castile
>>> chapter "Chapter 9" "The Great Assault · 7 August"
>>> stage p2-st-angelo
>>> actor valette 4 2 south
>>> actor ninu 4 4 north
>>> actor kateri 5 4 west
BALBI: Every gun they own fired at dawn. The walls of Castile are breached. The Grand Master is on the breach with a pike, seventy years old, in a plain helmet.
LA VALETTE: We fight here, or we die in the streets. There is no third choice.
NINU: Then we fight here, Eminence.
>>> prep
>>> battle a3-castile-breach
-> tower

= tower
>>> chapter "Chapter 10" "The Tower · late August"
>>> stage p1-workshop
>>> actor ninu 4 5 north
>>> actor kateri 4 3 south
KATERI: Scala has built them a siege tower. It's armoured like an Armatura, and it has a bridge to drop on our walls. I've seen the drawings. They're good. They're mine, from before the siege, when he came to Mdina asking to see my father's workshop.
NINU: Then you know where it's weak.
KATERI: The wheels, and the bridge chains. Get me close, and I'll show you.
>>> prep
>>> battle a4-siege-tower
-> engine

= engine
>>> chapter "Chapter 11" "Scala's Engine · early September"
>>> stage b6-kalkara-chapel
>>> actor ninu 5 6 north
>>> actor kateri 4 7 north
>>> actor scala 5 2 south
>>> actor pawlu 6 1 south
Word comes from a deserter that Scala has one last machine: a colossus, meant to walk through the breach. Pawlu Falzon is held inside its cage.
SCALA: The Order is starving, the Turk is sick, and the Viceroy of Sicily still dithers. Soon someone will pay me anything for victory. And you, boy, you're the sweetener.
NINU: You've had twenty-three years to leave us alone.
SCALA: I only learned of you last winter. Pawlu drinks when he is sad, you know. Bars in Birgu have ears. Engineers have big ones.
PAWLU: Ninu! Don't give him anything!
NINU: I'm not here to give. I'm here to take you home, Pa.
>>> prep
>>> battle a5-scala-engine
-> ending_cross

= ending_cross
>>> chapter "Epilogue" "The Cross · 8 September 1565"
>>> stage p2-st-angelo
>>> actor valette 4 2 south
>>> actor ninu 4 4 north
>>> actor pawlu 3 4 east
>>> actor kateri 5 4 west
On the seventh of September the relief army lands at Mellieħa. On the eighth, the Turkish fleet weighs anchor. The bells of Birgu ring all day.
BALBI: The Turk came with some forty thousand. Fewer than a third went home. Of us, perhaps six hundred could still hold a weapon. I have written all of their names that I could learn.
LA VALETTE: Pawlu Falzon. You kept your word to me, and to her, for twenty-three years.
PAWLU: I kept it to him, Eminence. Not to you.
{aff_valette >= 2:
    LA VALETTE: Ninu. I cannot give you my name. The Order forbids it, and the world would make you a pawn, as Scala tried to. But I can give you this.
    He sets a knight's cross in Ninu's palm.
    LA VALETTE: Not a brother of the Order. Its defender. That, you earned yourself.
    NINU: Thank you... Father.
    He says it so quietly that only the old man hears it. The Grand Master closes his eyes, just for a moment.
- else:
    LA VALETTE: You have served the Religion well, soldier. Malta will not forget.
    NINU: Neither will I, Eminence.
    It is not the conversation either of them wanted. Perhaps there will be time for that one later.
}
KATERI: So. What does a hero of the siege do now?
NINU: Goes home to Żejtun. Mends the nets. Rebuilds the farm. Maybe teaches a clockmaker to fish.
KATERI: Maybe the clockmaker teaches you to wind a spring properly.
>>> chapter "Ending: The Cross" "Thank you for playing"
>>> end
-> END
