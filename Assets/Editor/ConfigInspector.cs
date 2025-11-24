using Luau;
using UnityEngine;

[CustomAirshipEditor("Config")]
public class ConfigEditor : AirshipEditor
{
    private int Tab = 0;
    public override void OnInspectorGUI()
    {
        Tab = AirshipEditorGUI.BeginTabs(Tab, new[]
        {
            new GUIContent("Animation"),
            new GUIContent("Framework"),
            new GUIContent("CharacterInfo")
        });

        if (Tab == 0)
        {
            DrawAnimationTab();
        }

        if (Tab == 1)
        {
            DrawFrameworkTab();
        }

        if (Tab == 2)
        {
            DrawCharacterInfoTab();
        }

        AirshipEditorGUI.EndTabs();
    }

    void DrawAnimationTab()
    {
        PropertyFields("RigAnimationTilt", "HeadTilt", "EyeTilt");
    }

    void DrawFrameworkTab()
    {
        PropertyFields("GameSpeed", "Tickrate", "CollisionLayer", "ObjectLayer", "RailLayer");
    }

    void DrawCharacterInfoTab()
    {
        PropertyField("Character");
        AirshipEditorGUI.BeginGroup(new GUIContent("Character Properties"));
        
        var Character = serializedObject.airshipComponent.gameObject.GetAirshipComponent(AirshipType.GetType("Character"));
        if (Character)
        {
            CharacterEditor Editor = (CharacterEditor)AirshipCustomEditors.GetEditor(Character); // can this fail?
            Editor.DrawContained();
        }

        AirshipEditorGUI.EndGroup();
    }
}