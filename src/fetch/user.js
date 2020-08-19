const request = require('../request');

const parse = require('../data/types');
const { fromPronote } = require('../data/objects');

async function getUser(session)
{
    const { donnees: user } = await request(session, 'ParametresUtilisateur');

    const res = user.ressource;
    const establishment = parse(res.Etablissement);

    return {
        id: res.N,
        name: res.L,
        establishment: fromPronote(establishment),
        hasAvatar: res.avecPhoto,
        studentClass: fromPronote(res.classeDEleve),
        ClassHistory: parse(res.listeClassesHistoriques).pronoteMap(({ AvecNote, AvecFiliere }) => ({
            hadMarks: AvecNote,
            hadOptions: AvecFiliere
        })),
        groups: parse(res.listeGroupes).pronoteMap(),
        tabsPillars: parse(res.listeOngletsPourPiliers).pronoteMap(({ listePaliers }) => ({
            levels: parse(listePaliers).pronoteMap(({ listePiliers }) => ({
                pillars: parse(listePiliers).pronoteMap(({ estPilierLVE, estSocleCommun, Service }) => ({
                    isForeignLanguage: estPilierLVE,
                    isCoreSkill: estSocleCommun,
                    subject: Service && parse(Service).pronote()
                }))
            }))
        }), 'tab'),
        tabsPeriods: parse(res.listeOngletsPourPeriodes).pronoteMap(({ listePeriodes, periodeParDefaut }) => ({
            periods: parse(listePeriodes).pronoteMap(({ GenreNotation }) => ({
                isCorePeriod: GenreNotation === 1
            })),
            defaultPeriod: parse(periodeParDefaut).L
        }), 'tab'),
        establishmentsInfo: parse(user.listeInformationsEtablissements).pronoteMap(({ Logo, Coordonnees }) => ({
            logoID: parse(Logo),
            address: [Coordonnees.Adresse1, Coordonnees.Adresse2],
            postalCode: Coordonnees.CodePostal,
            postalLabel: Coordonnees.LibellePostal,
            city: Coordonnees.LibelleVille,
            province: Coordonnees.Province,
            country: Coordonnees.Pays,
            website: Coordonnees.SiteInternet
        })),
        userSettings: (({ version, EDT, theme, Communication }) => ({
            version,
            timetable: {
                displayCanceledLessons: EDT.afficherCoursAnnules,
                invertAxis: EDT.axeInverseEDT,
                invertWeeklyPlanAxis: EDT.axeInversePlanningHebdo,
                invertDayPlanAxis: EDT.axeInversePlanningJour,
                invertDay2PlanAxis: EDT.axeInversePlanningJour2,
                dayCount: EDT.nbJours,
                resourceCount: EDT.nbRessources,
                daysInTimetable: EDT.nbJoursEDT,
                sequenceCount: EDT.nbSequences
            },
            theme: theme.theme,
            unreadDiscussions: Communication.DiscussionNonLues
        }))(user.parametresUtilisateur),
        sessionAuthorizations: {
            twitterManagement: user.autorisationsSession.fonctionnalites.gestionTwitter,
            expandedAttestation: user.autorisationsSession.fonctionnalites.attestationEtendue
        },
        authorizations: (a => ({
            discussions: a.AvecDiscussion,
            teachersDiscussions: a.AvecDiscussionProfesseurs,
            timetableVisibleWeeks: parse(a.cours.domaineConsultationEDT),
            canEditLessons: parse(a.cours.domaineModificationCours),
            hideClassParts: a.cours.masquerPartiesDeClasse,
            maxEstablishmentFileSize: a.tailleMaxDocJointEtablissement,
            maxUserWorkFileSize: a.tailleMaxRenduTafEleve,
            hasPassword: a.compte.avecSaisieMotDePasse,
            hasPersonalInfo: a.compte.avecInformationsPersonnelles,
            canPrint: a.autoriserImpression
        }))(user.autorisations),
        minPasswordSize: user.reglesSaisieMDP.min,
        maxPasswordSize: user.reglesSaisieMDP.max,
        passwordRules: parse(user.reglesSaisieMDP.regles),
        kioskAccess: user.autorisationKiosque,
        tabs: user.listeOnglets.map(parseTab),
        hiddenTabs: user.listeOngletsInvisibles,
        notifiedTabs: user.listeOngletsNotification
    };
}

function parseTab({ G: id, Onglet: subs })
{
    return { id, subs: (subs || []).map(parseTab) };
}

module.exports = getUser;
