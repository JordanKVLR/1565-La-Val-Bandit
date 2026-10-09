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
-> hospital_tents

= hospital_tents
>>> chapter "Interlude" "The Hospital Tents · 7 August"
>>> stage p3-camp
>>> actor leyla 3 3 south
>>> actor deniz 3 5 north
>>> actor yusuf 4 4 west
While every gun and frame of the Pasha's army is thrown at Birgu and Senglea, the great camp at the Marsa lies almost empty: cooks, grooms, and the long rows of tents where the sick and the wounded lie.
LEYLA: Hold still. You've torn the stitches again.
DENIZ: They should have let me stay at the breach, Mother, not send me back here to guard the cook-pots.
YUSUF: They sent you back because you can barely lift a sword above your shoulder. Be grateful. That breach is eating men alive, theirs and ours.
DENIZ: I saw him there, Father. Through the smoke, on the wall of Castile. A frame in white and red, with gold on the shoulders and half a bronze coin painted on its breast. The farmer from Kalkara. I'd know the way he moves anywhere.
Leyla's needle stops.
LEYLA: Half a coin?
DENIZ: Like the one you keep in your sash. Scala wanted one from him, at Kalkara. Mother, what is it?
LEYLA: Nothing. The heat. Let me finish this.
{aff_deniz > 0:
    DENIZ: He let me go, that night. I was glad I didn't have to cross blades with him today.
    LEYLA: So am I, my son. More than you know.
- else:
    DENIZ: He tried to put me in chains, that night. Next time I'll be the one doing the chaining.
    LEYLA: Next time, let someone else do it. Please.
}
>>> actor janissary 6 4 west
JANISSARY: Horsemen! Christian horsemen from the west, from the Mdina road! They're in the camp, firing the tents!
YUSUF: The Mdina cavalry. They've waited all summer for a morning like this. And there is nobody left here to stop them.
DENIZ: There are four hundred men in those tents who can't stand up.
YUSUF: Then we stand for them. Hamid, Ilyas, to your frames!
LEYLA: And me.
DENIZ: Mother?
LEYLA: I lived twenty years in a corsair's household. I know which end of a grenado to throw. Help me up into that Humbaracı, and stop gaping.
>>> exit janissary
>>> prep
>>> battle a6-sick-tents
-> after_tents

= after_tents
>>> stage p3-camp
>>> actor deniz 3 5 north
>>> actor yusuf 4 4 west
>>> actor leyla 3 3 south
Smoke drifts over the Marsa. The horsemen are gone as quickly as they came, and from the direction of Birgu the drums are sounding the recall.
YUSUF: The Pasha has called the army back from the breach. He thinks the relief from Sicily has landed. All of that blood at Castile, thrown away for a few riders and an empty camp.
DENIZ: Not empty. We were here.
YUSUF: We were. Remember this morning, navigator. A war is mostly a matter of the right few men at the right moment.
Later, when the men have gone to count the dead, Leyla sits alone among the scorched tents with her half of the medallion in her palm.
LEYLA: A frame in white and red. God keep him. God keep them both.
BALBI: Only later did we learn why the Turk broke off when Castile was all but his. The horsemen of Mdina had fallen on his camp at the Marsa. Of what they found there, and what it cost on both sides, I will say only that it was war.
-> countermine

= countermine
>>> chapter "Chapter 10" "The Countermine · after 18 August"
>>> stage p1-workshop
>>> actor ninu 4 5 north
>>> actor kateri 5 4 west
>>> actor balbi 3 4 east
KATERI: Put your hand on the floor. No, flat. Now watch the bowl.
She has set a basin of water on the flagstones of a cellar under the Post of Castile. Every few heartbeats, its surface shivers.
KATERI: Picks. Under the ditch, coming this way. They're digging another mine, like the one that brought our wall down on the eighteenth.
BALBI: The Grand Master took a wound in the leg that day and would not leave the breach. I would rather he were not asked to do it twice.
NINU: So we dig down and meet them?
KATERI: Our miners already have. They broke into the Turkish gallery an hour ago. The powder is going in now, from a shaft out in their trench beyond the ditch. Somebody has to cross the ditch and drop a counter-charge down that shaft before they light theirs.
NINU: Somebody.
KATERI: Me. I made the charge, and I know how a fuse wants to burn. You keep them off me.
* [Trust her to do it]
    ~ aff_kateri += 1
    NINU: Then I'll walk in front of you the whole way. Don't stop for anything.
    KATERI: I never do.
* [Offer to carry the charge yourself]
    NINU: Give it to me. My frame's heavier, and I'm the one they want alive.
    KATERI: Your frame's heavier, your hands are clumsier, and you'd cut the fuse too short. No.
- BALBI: If the Master Sapper falls, his crews will scatter, and the mine dies with him. Remember that, if the shaft is too hot to reach.
>>> prep
>>> battle a7-countermine
-> tower

= tower
>>> chapter "Chapter 11" "The Tower · late August"
>>> stage p1-workshop
>>> actor ninu 4 5 north
>>> actor kateri 4 3 south
KATERI: Scala has built them a siege tower. It's armoured like an Armatura, and it has a bridge to drop on our walls. I've seen the drawings. They're good. They're mine, from before the siege, when he came to Mdina asking to see my father's workshop.
NINU: Then you know where it's weak.
KATERI: The wheels, and the bridge chains. Get me close, and I'll show you.
>>> prep
>>> battle a4-siege-tower
-> last_assault

= last_assault
>>> chapter "Chapter 12" "The Last Assault · 1 September"
>>> stage p2-st-angelo
>>> actor valette 4 2 south
>>> actor ninu 4 4 north
>>> actor balbi 3 4 east
BALBI: The Turk has buried a third of his army and eaten most of his horses. Even his janissaries go forward slowly now. But they go. Today he sends everything he has left against Senglea.
LA VALETTE: This is his last throw of the dice. Senglea has fewer men on its walls than it has breaches. Take your frames over the bridge of boats and hold the walls of St Michael.
* [Promise him you'll hold]
    ~ aff_valette += 1
    NINU: Senglea will be standing tonight, Eminence.
    LA VALETTE: Then come back standing with it. That is also an order.
* [Ask about the relief from Sicily]
    NINU: Is there any word from Sicily, Eminence?
    LA VALETTE: Don García writes that he is coming. He has written so since June. Fight as though no one is coming, and perhaps someone will.
- >>> prep
>>> battle a8-st-michael
-> engine

= engine
>>> chapter "Chapter 13" "Scala's Engine · early September"
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
-> after_engine

= after_engine
>>> stage b6-kalkara-chapel
>>> actor ninu 5 5 north
>>> actor kateri 4 6 north
>>> actor pawlu 5 3 south
The colossus lies on its side among the broken arches, hissing like a kettle left on the fire. The door of its cage hangs open.
NINU: Pa!
PAWLU: Look at you. In a knight's frame, with a knight's sword. Your mother would... well. Never mind your mother. Not tonight.
KATERI: Ninu. The pilot's hatch. It's empty.
Far down on the rocks, a man in a scorched coat is scrambling away towards the Turkish lines.
NINU: Scala!
PAWLU: Let him run, son. Stay with me a while. Just a while.
-> abandoned_lines

= abandoned_lines
>>> chapter "Chapter 14" "The Abandoned Lines · 8 September"
>>> stage p2-st-angelo
>>> actor valette 4 2 south
>>> actor ninu 4 4 north
>>> actor kateri 5 4 west
>>> actor pawlu 3 4 east
On the seventh of September a rider from Mdina brings the news at last: the relief army from Sicily is ashore at Mellieħa. All night the Turk drags his guns down to his boats and sets his own camp at the Marsa alight.
LA VALETTE: The Pasha is leaving. He has left a rearguard in his lines at the Marsa to cover the boats. And a guest he will not take home with him.
KATERI: Scala.
LA VALETTE: A Genoese galliot is moored in the creek below the Marsa, flying no colours. My lookouts say crates are going aboard, a great many of them, and that the rearguard is guarding them. Scala's last gold has bought him their loyalty until noon.
NINU: His drawings. Every frame he's ever designed.
KATERI: And mine, and my father's. If he sails with those, there will be Armature on every battlefield from Flanders to Persia. He'll sell them to the next war, and to the one after that.
LA VALETTE: Today is the feast of Our Lady's Nativity. The bells of Birgu will ring at noon. I would like them to ring for something finished.
* [Ask for his blessing]
    ~ aff_valette += 1
    NINU: Then give me your blessing, Eminence. Before I go.
    The Grand Master hesitates. Then he lays his hand on Ninu's head, as a priest would, or a father.
    LA VALETTE: Go with God, my son.
* [Simply go]
    NINU: Then they'll ring for it. Kateri, wake the others.
- PAWLU: Ninu. Come back. I've only just got you back.
NINU: I will, Pa. Keep the nets dry for me.
>>> prep
>>> battle a9-marsa-lines
-> after_lines

= after_lines
>>> stage a9-marsa-lines
>>> actor ninu 5 3 north
>>> actor kateri 4 3 north
>>> actor scala 5 2 south
Scala's frame lies half-sunk in the creek. Its pilot sits on the jetty, soaked to the skin, among his crates, while the galliot burns behind him.
SCALA: Do you know what's in those crates, boy? The future. Fifty years of war, already drawn.
KATERI: Then it can go up in smoke with the present.
She tips the first crate into the fire. The drawings curl, blacken and lift away over the water like birds.
NINU: You'll answer to the Grand Master, Signore. And then I hope you live a long time, in a small cell, with no paper.
SCALA: You have his stubbornness. And hers. What a pretender you would have made.
NINU: I'd rather be a fisherman.
-> ending_cross

= ending_cross
>>> chapter "Epilogue" "The Cross · 8 September 1565"
>>> stage p2-st-angelo
>>> actor valette 4 2 south
>>> actor ninu 4 4 north
>>> actor pawlu 3 4 east
>>> actor kateri 5 4 west
By evening on the eighth of September the Turkish fleet has weighed anchor and stands out to sea. The bells of Birgu ring all day, and long into the night.
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
Far out beyond the harbour mouth, a corsair galley turns north with the rest of the fleet. At her stern a young navigator watches the island go, and beside him a woman holds half of a broken medallion. Ninu, on the walls of St Angelo, does not see them. Not this time.
KATERI: So. What does a hero of the siege do now?
NINU: Goes home to Żejtun. Mends the nets. Rebuilds the farm. Maybe teaches a clockmaker to fish.
KATERI: Maybe the clockmaker teaches you to wind a spring properly.
>>> chapter "Ending: The Cross" "Thank you for playing"
>>> end
-> END
