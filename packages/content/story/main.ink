// Armatura 1565: master script. The game reads `>>> command args` lines as actions:
//   chapter "Title" "Subtitle"   title card (also an autosave point)
//   stage <mapId>                set the diorama map for the scene, clearing actors
//   actor <castId> <x> <y> <facing>   place or move a character on the stage
//   exit <castId>...             remove characters from the stage
//   join <characterId> [frame] [weapon]   add a pilot to the roster
//   battle <battleId>            play a battle; the story continues after victory
//   prep                         open the preparation screen (loadouts, shop)
//   scudi <n>                    give money
//   end                          end of the current content
// Lines written "NAME: text" are spoken by the cast member whose speaker tag is NAME.
INCLUDE globals.ink
INCLUDE prologue.ink
INCLUDE act1.ink

-> prologue
