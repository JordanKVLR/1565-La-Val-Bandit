// Camp talks: short optional scenes between battles, opened from the preparation screen.
// Each knot is named camp_<scene id with underscores>, raises one bond variable, and ends with
// `>>> endcamp` (the game then returns to preparation). Scenes are listed in data/camp.json.

=== camp_kateri_springs ===
>>> stage p1-workshop
>>> actor ninu 4 5 north
>>> actor kateri 5 4 west
Lamplight on brass. Kateri has the knee-spring of Ninu's Ħaddiem clamped in a vice and is humming something out of tune.
KATERI: Come here. Put your thumb on the coil, there, and tell me what you feel.
NINU: It's warm.
KATERI: It's tired. A spring is a promise: "I'll give back what you give me." Push it past what it can keep, and it stops promising.
NINU: Pa says that about nets.
KATERI: Your father and my father would have got on. Mine kept every broken spring he ever pulled, in a barrel, in case one of them wanted to be forgiven.
* [Ask what happened to the barrel]
    NINU: What happened to the barrel?
    KATERI: The Genoese bought it with the rest. He paid for the barrel, Ninu. I've never understood that, the springs, the barrel.
* [Offer to carry her toolbag]
    NINU: You carry the hardest thing in the arsenal. Let me carry the toolbag.
    KATERI: Don't be sweet. It makes me suspicious. ...Take the left strap.
- She slides a fresh spring into the housing and closes it with a click.
KATERI: There. Now it promises more than you'll ask. That's how you keep a pilot alive.
~ aff_kateri += 1
>>> endcamp
-> END

=== camp_ganni_nets ===
>>> stage p0-zejtun
>>> actor ninu 3 4 north
>>> actor ganni 2 5 east
>>> actor rozi 5 5 west
Behind the lines at Birgu they have found a cracked fishing boat and, improbably, a bucket of olives. The three of them sit in its shade.
ĠANNI: Do you remember when your father took us out past Delimara, and we caught nothing, and he said the sea was only being polite?
NINU: He said it was giving us time to think.
ROŻI: He said the fish had gone to Sicily to avoid the militia levy. I believed him for a year.
ĠANNI: I miss the fish.
NINU: I miss the part where nobody was shooting.
Rożi spits an olive stone over the gunwale, neatly, into the water.
ROŻI: When this is over, we're not coming back to Żejtun. We're going to open a tavern, and Ġanni will serve, because he talks to everyone and nobody minds.
ĠANNI: And Ninu?
ROŻI: Ninu will sit in the corner and be mysterious about his medallion.
NINU: I will not.
ĠANNI: You will, a little.
~ bond_ninu_ganni += 1
>>> endcamp
-> END

=== camp_luis_discipline ===
>>> stage p1-workshop
>>> actor ninu 4 5 north
>>> actor luis 3 3 south
Fra Luis is cleaning his sword with a cloth, slowly, the way old soldiers do when they would rather not be asked how they are.
FRA LUIS: You hold your weight on the back foot when you meet a charge. Why?
NINU: So I can get out of the way.
FRA LUIS: And when you cannot get out of the way?
NINU: ...Then I've lost.
FRA LUIS: No. Then you shift forward and take it on the shoulder, and you let the line behind you see that you are not afraid. That is what discipline is for. It is not obedience. It is knowing which fear to feel.
* [Ask which fear he feels]
    NINU: Which fear do you feel, sir?
    FRA LUIS: All of them, boy. I simply know the order in which to feel them.
* [Practise the shift on the spot]
    NINU: Show me again.
    FRA LUIS: Slower. Slower than that. You are not a cannon.
- Luis sheathes the sword and, for the first time, almost smiles.
FRA LUIS: You will do.
~ aff_luis += 1
>>> endcamp
-> END

=== camp_rozi_wind ===
>>> stage p0-zejtun
>>> actor ninu 3 4 north
>>> actor rozi 5 5 west
Rożi is stripping her arquebus on a grain sack, laying each part out in a line like a row of seeds.
ROŻI: You hold the match too close to your face. One day a spark will take your eyebrows.
NINU: I don't use a match. I have a blade.
ROŻI: Then hold the blade closer to your face and see.
She laughs, and he does too. It is a relief to laugh.
ROŻI: Listen. When you fire, you wait for the end of your breath. Not the beginning. The end. The world is quietest there.
NINU: Is that true?
ROŻI: Nobody has ever checked. Try it.
He does. For a moment the camp is utterly silent.
NINU: ...It is.
ROŻI: Told you.
~ bond_ninu_rozi += 1
>>> endcamp
-> END

=== camp_luis_rhodes ===
>>> stage p2-st-angelo
>>> actor ninu 4 4 north
>>> actor luis 3 4 north
On the ramparts of St Angelo the night wind brings the smell of burning from the far shore.
FRA LUIS: I was at Rhodes. You have heard of it. Everyone has.
NINU: You were a boy.
FRA LUIS: I was eighteen. Old enough to know what I was looking at. Six months we held it. Then Suleiman offered terms, and the Grand Master took them, and we sailed away with our banners and left the island to the Turk.
NINU: Honourably.
FRA LUIS: Honourably. I have never forgiven the word.
He looks across the harbour at the fires.
FRA LUIS: There is a man in that fort over there who was at Rhodes too. When the terms came, he said nothing at all. Then he spent forty years making sure it could never happen again.
NINU: La Valette.
FRA LUIS: Do not say his name where the wind can carry it. But yes.
~ aff_luis += 1
>>> endcamp
-> END

=== camp_kateri_drawings ===
>>> stage p1-workshop
>>> actor ninu 4 5 north
>>> actor kateri 5 4 west
Kateri has spread her father's drawings across the workbench, weighting the corners with spanners. Ninu stands at the edge of the lamplight.
KATERI: Look at the margins. This is Scala's hand. He's annotated every plate. "Lighter." "Cheaper." "Can the boiler be hidden?"
NINU: Hidden?
KATERI: So a frame could be sold as something else. He was never designing for my father's clients. He was designing for whoever could pay for a secret.
NINU: Why do you keep looking at them?
KATERI: Because my father drew the thing he was proudest of right here, in the corner, and it's the only line on the page nobody corrected.
She turns the sheet. A small sketch: a clockmaker's daughter at a bench, with a spanner, scowling.
KATERI: He drew me, Ninu. In the corner of a war machine.
* [Say she should keep it]
    NINU: Keep it. Then he won.
    KATERI: ...Yes. That's the right answer. Annoying.
* [Say nothing, and hand her a rag]
    Ninu says nothing. He hands her a rag, and she wipes her eyes with it, furiously, and pretends it was the oil.
- She folds the drawing along its old crease and tucks it into her shirt, next to her heart, where no Genoese can annotate it.
~ aff_kateri += 1
>>> endcamp
-> END

=== camp_balbi_diary ===
>>> stage p1-workshop
>>> actor ninu 4 5 north
>>> actor balbi 3 4 east
Balbi is writing by the light of a single lamp, his tongue between his teeth, filling a page in cramped, clever script.
BALBI: Don't read over my shoulder. You'll spoil the surprise.
NINU: You wrote my name.
BALBI: I write everybody's name. Look, here is Fra Luis, and here is Kateri, and here is a man I never met who died on the ravelin with an arquebus in his hands and a letter in his shirt. I have copied the letter too.
NINU: What did it say?
BALBI: "Dear mother. The weather is fine. Do not worry." That is all they ever write.
Balbi turns a page, and another, and shows him a long column of names with a little cross beside each.
BALBI: When this is over, someone will read this, and they will say: these people were real.
NINU: Put me in a better light than I deserve.
BALBI: I never do. I put you in exactly the light you stood in.
~ bond_ninu_balbi += 1
>>> endcamp
-> END

=== camp_balbi_kateri ===
>>> stage p1-workshop
>>> actor kateri 5 4 west
>>> actor balbi 3 4 east
KATERI: You've got ink on your sleeve.
BALBI: I have ink on everything. It's the mark of the trade.
KATERI: I have oil on everything. It's the mark of mine. Between us we ought to be able to write a whole siege in black.
BALBI: You laugh. I am thinking of putting your valves in the chronicle. A proper description. Pressures, tolerances.
KATERI: Nobody wants to read about tolerances.
BALBI: Someone, in three hundred years, will. They will want to know how a girl kept the Order's frames walking with a toolbag and a grudge.
KATERI: ...Put in the grudge. Leave out the toolbag.
BALBI: The toolbag is the best part.
~ bond_kateri_balbi += 1
>>> endcamp
-> END

=== camp_ganni_stakes ===
>>> stage p0-zejtun
>>> actor ninu 3 4 north
>>> actor ganni 2 5 east
Ġanni is sitting on an upturned crate with his hands wrapped in rag, flexing his fingers.
ĠANNI: Never again. I mean it. The water was so cold it made my teeth ache for a week.
NINU: You volunteered.
ĠANNI: Everyone volunteered! Nobody wanted to be the one who didn't! That's the whole trick of a siege, Ninu. You discover you'd rather drown than be embarrassed.
NINU: Is that the trick?
ĠANNI: And the other half is you discover everyone else would too. And that's... that's very comforting, actually.
He looks at his rag-wrapped hands as if they belong to someone braver.
ĠANNI: Don't tell Rożi I said that.
NINU: She already knows.
~ bond_ninu_ganni += 1
>>> endcamp
-> END

=== camp_kateri_mine ===
>>> stage p1-workshop
>>> actor ninu 4 5 north
>>> actor kateri 5 4 west
Kateri sits on an upturned bucket with a cooling fuse across her knees, her hands perfectly steady and her face gone grey.
KATERI: It burned a hand's width shorter than I measured.
NINU: But it burned.
KATERI: It burned. They are in the dark, with the dust of their own gallery on top of them, and I did that.
NINU: You saved Castile.
KATERI: I know. Both things are true. Why does nobody tell you both things are true?
He sits on the floor beside her bucket, which is a little undignified for a knight's pilot, and says nothing for a while.
KATERI: You don't have to say anything.
NINU: I'm not. I'm keeping the other half of the silence.
She laughs, one short, wet breath, and leans her head against his shoulder.
~ aff_kateri += 1
>>> endcamp
-> END

=== camp_balbi_wall ===
>>> stage p2-st-angelo
>>> actor ninu 4 4 north
>>> actor balbi 3 4 east
BALBI: I want to describe the wall at St Michael. Tell me what it looked like to you.
NINU: Like a wall that had stopped being one. Rubble, mostly. A staircase that went nowhere. A man in a plain helmet pulling a pike out of a janissary.
BALBI: The Grand Master.
NINU: Yes.
BALBI: The Order will want that in the chronicle. The word they like is "heroic."
NINU: It wasn't heroic. It was stubborn. The wall was where we were standing, so we stood there.
BALBI: ...That's better. That's much better. May I use it?
NINU: Use it. Just leave my name off.
BALBI: I never leave names off. That is the only rule I have.
~ bond_ninu_balbi += 1
>>> endcamp
-> END

=== camp_anastagi_horse ===
>>> stage s-mdina
>>> actor ninu 4 4 north
>>> actor anastagi 4 2 south
Captain Anastagi is feeding a grey mare from his own pocket, which is not allowed, and not remarked upon.
ANASTAGI: You looked surprised when I said "bluff."
NINU: I thought a captain would call it a stratagem.
ANASTAGI: Stratagem is what you say afterward, when it worked. Before, it's a bluff, and you pray. I've commanded the Mdina horse for twelve years, Falzon. Most of that time we've been a bluff with spurs.
NINU: Why does the Turk believe it?
ANASTAGI: Because he wants to. A man marching in the heat wants an excuse to turn back. We give him one.
He rubs the mare's nose.
ANASTAGI: Remember that when you're afraid. The enemy is tired too. Give him a reason to stop.
~ bond_ninu_anastagi += 1
>>> endcamp
-> END

=== camp_rozi_bay ===
>>> stage i6-zebbug-wells
>>> actor ninu 2 8 north
>>> actor rozi 3 3 east
ROŻI: My uncle fished out of Ġnejna. Every rock, every current. He taught me to read the water the way you read a face.
NINU: And what does it say tonight?
ROŻI: It says: tonight we steal something very important from a man who doesn't know it's missing.
NINU: Rożi, if you're caught...
ROŻI: Then the Viceroy of Sicily will have a very bad evening, because I'll talk until dawn. I've been practising. Ġanni's been giving me tips.
She laughs, but her hands are on the stock of her arquebus, and they are not quite still.
ROŻI: Keep a beach free. That's all. A little patch of sand, with no horses on it.
NINU: I'll keep the whole bay.
~ bond_ninu_rozi += 1
>>> endcamp
-> END

=== camp_ganni_well ===
>>> stage i6-zebbug-wells
>>> actor ninu 2 8 north
>>> actor ganni 3 8 north
Ġanni is sitting on the lip of the well with his boots off, trailing his feet in a patch of shade.
ĠANNI: Sweet water. After all of it, sweet water.
NINU: Ċensu would be pleased.
ĠANNI: Ċensu would be insufferable. He'd tell the whole of Mdina he single-handedly saved it from thirst.
NINU: He more or less did.
ĠANNI: I know, and that's the worst of it. He'll be right. Heroes are always the people who stayed put and wouldn't move.
He looks up at the sky, at the thin first stars.
ĠANNI: Ninu. If I don't make it through this...
NINU: You will.
ĠANNI: If I don't, tell Rożi she was right about the tavern.
~ bond_ninu_ganni += 1
>>> endcamp
-> END

=== camp_deniz_brothers ===
>>> stage p3-camp
>>> actor ninu 3 5 north
>>> actor deniz 4 5 north
They have found, by an old well at the edge of the camp, a quiet corner that smells of dust and figs.
DENIZ: Hold still. Turn your head. No, the other way.
NINU: What are you doing?
DENIZ: Looking at your jaw. It's the same as mine. I've been staring at it in the mirror for a week and it's the same.
NINU: I'm sorry.
DENIZ: Don't be. I thought it would feel like losing something. A brother, a family I didn't have. It doesn't. It feels like... finding a drawer I'd always meant to open.
NINU: That's the strangest thing anyone has ever said about me.
DENIZ: I'm a navigator. We think in rooms and drawers and charts.
He holds out a fig. Ninu takes it.
DENIZ: Eat. We have a mother to look after, and a war.
~ aff_deniz += 1
>>> endcamp
-> END

=== camp_leyla_supper ===
>>> stage p3-camp
>>> actor leyla 3 3 south
>>> actor ninu 3 5 north
Leyla has built a small fire and found, somehow, an iron pot, an onion and half a chicken.
LEYLA: Sit. Eat. You are too thin. All Maltese are too thin. It is a failing of the island.
NINU: It's not, we just don't eat in the middle of a siege.
LEYLA: Then you will begin. Hold this.
She hands him the spoon. He holds it with great seriousness.
LEYLA: Your father... Pawlu. Did he cook for you?
NINU: Badly. Fish, always. Fish in every direction.
LEYLA: Good. Then you will know what a proper meal is. Taste. Tell me what it needs.
NINU: Salt?
LEYLA: Salt. You are my son.
They laugh. It is a small, ordinary laugh, and it fills the tent.
~ bond_ninu_leyla += 1
>>> endcamp
-> END

=== camp_yusuf_keel ===
>>> stage p3-camp
>>> actor yusuf 4 3 west
>>> actor deniz 4 5 north
YUSUF: Sit. Don't stand there like a mast.
DENIZ: Father, I should say something.
YUSUF: Then say it sitting.
Deniz sits. Yusuf takes a long time to begin.
YUSUF: When you were three, your mother brought you to my ship. I'd never seen a child with so little fear of the sea. I thought: here is a boy who will outlive me.
DENIZ: And?
YUSUF: And I decided I would raise you as mine, whatever name was on the paper. That has not changed. I wanted you to hear it before this battle, not after.
DENIZ: You are my father.
YUSUF: And Pawlu's boy is your brother. I can hold two things in my arms, Deniz. I am a sailor. Ropes are for that.
~ bond_deniz_yusuf += 1
>>> endcamp
-> END

=== camp_deniz_leyla ===
>>> stage c7-marsa-hospital
>>> actor leyla 6 6 west
>>> actor deniz 7 6 west
Leyla is rinsing a cloth in a bucket of grey water. Deniz kneels beside her, wordless, and begins to wring another.
LEYLA: You are not required.
DENIZ: Neither are you.
LEYLA: I am required. I am a mother. The boy at the end of the row is somebody's son.
DENIZ: And I'm yours.
She stops. The water drips from the cloth into the bucket.
LEYLA: I have thought, every night for twenty-three years, that I would not be forgiven for what I chose.
DENIZ: Forgiven by whom?
LEYLA: By the one I gave away. By the one I kept.
DENIZ: I can't speak for him. I can speak for me: there is nothing to forgive. You kept me. You are still here.
Leyla does not answer. She wrings the cloth, and wrings it again, and for a long while they work in silence.
~ bond_deniz_leyla += 1
>>> endcamp
-> END

=== camp_kateri_trench ===
>>> stage c8-castile-trenches
>>> actor ninu 5 8 north
>>> actor kateri 6 8 north
They have found a dry corner in the trench, under a hump of earth, and Kateri is eating dried figs with the grim concentration of a woman who has not slept.
KATERI: When the tower burned, I thought: that's mine. The wheels, the chains. My father's drawings. I made him kill a siege tower with his own ideas.
NINU: You killed it.
KATERI: Yes. And I'm not sorry, and that's the worst thing, I'm not sorry at all. I thought I'd feel something.
NINU: Maybe it comes later.
KATERI: Maybe. Or maybe the thing I feel is just: the work was good. That's all it ever was. Good work, pointed in the wrong direction by the wrong man, then pointed back.
She offers him a fig. He takes it.
KATERI: When this is over, I'm going to build something that doesn't kill anyone. A clock, probably. A very large clock.
NINU: With a very large spring.
KATERI: A very, very large spring.
~ aff_kateri += 1
>>> endcamp
-> END
